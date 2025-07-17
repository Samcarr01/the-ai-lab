import Stripe from 'stripe'
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'
import { UserTier } from './user'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
}

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

// Client-side Stripe instance
let stripePromise: Promise<StripeJS | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// 3-Tier Stripe Configuration
export const STRIPE_CONFIG = {
  CURRENCY: 'gbp',
  PLANS: {
    free: {
      name: 'Free',
      price: 0,
      priceId: null, // No Stripe price ID for free tier
      description: 'Get started with AI',
      features: [
        'Blog access',
        'GPT previews',
        'Playbook previews',
        'Community access'
      ]
    },
    pro: {
      name: 'Pro',
      price: 700, // £7.00 in pence
      priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
      description: 'Daily AI Use',
      features: [
        'Everything in Free',
        '3 essential GPTs',
        '2 core playbooks',
        'Email support'
      ]
    },
    ultra: {
      name: 'Ultra',
      price: 1900, // £19.00 in pence
      priceId: process.env.STRIPE_ULTRA_PRICE_ID || 'price_ultra_monthly',
      description: 'Upscale Your AI Game',
      features: [
        'Everything in Pro',
        'All 7 GPTs',
        'All 4 playbooks',
        'Priority support',
        'Early access'
      ]
    }
  }
}

// Helper functions for tier management
export const stripeHelpers = {
  // Get plan configuration by tier
  getPlanConfig(tier: UserTier) {
    return STRIPE_CONFIG.PLANS[tier]
  },

  // Create checkout session for specific tier
  async createCheckoutSession(tier: UserTier, userId: string, userEmail: string) {
    const plan = STRIPE_CONFIG.PLANS[tier]
    
    if (!plan.priceId) {
      throw new Error(`No price ID configured for tier: ${tier}`)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        userId,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?tier=${tier}&canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          tier,
        },
      },
      // Enable additional payment methods
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      phone_number_collection: {
        enabled: false,
      },
      automatic_tax: {
        enabled: false,
      },
      // Optimize for mobile
      locale: 'en',
    })

    return session
  },

  // Get price display for tier
  getPriceDisplay(tier: UserTier): string {
    const plan = STRIPE_CONFIG.PLANS[tier]
    if (plan.price === 0) return 'Free'
    return `£${(plan.price / 100).toFixed(0)}/month`
  },

  // Get tier from Stripe price ID
  getTierFromPriceId(priceId: string): UserTier | null {
    for (const [tier, config] of Object.entries(STRIPE_CONFIG.PLANS)) {
      if (config.priceId === priceId) {
        return tier as UserTier
      }
    }
    return null
  },

  // Validate tier upgrade path
  isValidUpgrade(currentTier: UserTier, targetTier: UserTier): boolean {
    const tierLevels = { free: 0, pro: 1, ultra: 2 }
    return tierLevels[targetTier] > tierLevels[currentTier]
  },

  // Get upgrade options for current tier
  getUpgradeOptions(currentTier: UserTier): UserTier[] {
    const tierLevels = { free: 0, pro: 1, ultra: 2 }
    const currentLevel = tierLevels[currentTier]
    
    return (Object.keys(tierLevels) as UserTier[]).filter(
      tier => tierLevels[tier] > currentLevel
    )
  },

  // Create customer portal session for subscription management
  async createPortalSession(customerId: string) {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    })
    return session
  },

  // Get subscription details
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      return null
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      return subscription
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return null
    }
  },

  // Reactivate subscription
  async reactivateSubscription(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })
      return subscription
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      return null
    }
  }
}

// Backward compatibility - keep existing PRO_PLAN constants
export const PRO_PLAN_PRICE_ID = STRIPE_CONFIG.PLANS.pro.priceId
export const PRO_PLAN_AMOUNT = STRIPE_CONFIG.PLANS.pro.price