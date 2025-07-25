import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { userService } from '@/lib/user'
import { getStripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user profile
    const userProfile = await userService.getProfile(user.id)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user has an active subscription
    if (!userProfile.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Cancel the subscription at period end via Stripe
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.update(
      userProfile.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Update user's subscription status in database
    await userService.updateSubscriptionStatus(user.id, {
      subscriptionStatus: 'cancelling',
      cancelAtPeriodEnd: true
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      subscription: {
        id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end
      }
    })

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}