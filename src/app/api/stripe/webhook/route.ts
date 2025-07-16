import { NextRequest, NextResponse } from 'next/server'
import { stripe, stripeHelpers } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { userService, type UserTier } from '@/lib/user'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier as UserTier

        if (!userId || !tier) {
          console.error('Missing userId or tier in session metadata')
          break
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        
        // Update user tier and subscription data
        const success = await userService.updateTier(userId, tier, {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
        })

        if (success) {
          console.log(`✅ User ${userId} upgraded to ${tier}`)
        } else {
          console.error(`❌ Failed to upgrade user ${userId} to ${tier}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade user to free tier
        const { error } = await supabase
          .from('users')
          .update({
            user_tier: 'free',
            is_pro: false,
            subscription_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error downgrading user to free:', error)
        } else {
          console.log(`❌ Subscription cancelled for customer ${customerId} - downgraded to free`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const isActive = subscription.status === 'active'

        // Get tier from subscription price ID
        const priceId = subscription.items.data[0]?.price.id
        const tier = stripeHelpers.getTierFromPriceId(priceId) || 'free'

        // Update user subscription status
        const { error } = await supabase
          .from('users')
          .update({
            user_tier: isActive ? tier : 'free',
            is_pro: isActive && (tier === 'pro' || tier === 'ultra'),
            subscription_status: subscription.status,
            subscription_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            subscription_cancel_at_period_end: (subscription as any).cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating subscription:', error)
        } else {
          console.log(`🔄 Subscription updated for customer ${customerId}: ${tier} (${subscription.status})`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Update subscription status to past_due
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating payment failed status:', error)
        } else {
          console.log(`⚠️ Payment failed for customer ${customerId} - marked as past_due`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Update subscription status to active
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (error) {
          console.error('Error updating payment succeeded status:', error)
        } else {
          console.log(`✅ Payment succeeded for customer ${customerId} - marked as active`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}