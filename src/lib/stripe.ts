import Stripe from 'stripe'
import { UserTier } from './user'
import { STRIPE_CONFIG } from './stripe-config'

// Only check for server-side environment variables on server
let stripe: Stripe | null = null

// Initialize Stripe only on server-side
function getStripeInstance() {
  if (typeof window !== 'undefined') {
    // Client-side - don't initialize server Stripe
    throw new Error('Server-side Stripe instance should not be used on client')
  }
  
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required')
    }
    
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
      typescript: true,
    })
  }
  
  return stripe
}

// Helper functions for tier management (server-side only)
export const stripeHelpers = {
  // Get plan configuration by tier
  getPlanConfig(tier: UserTier) {
    return STRIPE_CONFIG.PLANS[tier]
  },

  // Create checkout session for specific tier
  async createCheckoutSession(tier: UserTier, userId: string, userEmail: string) {
    const stripeInstance = getStripeInstance()
    const plan = STRIPE_CONFIG.PLANS[tier]
    
    if (!plan.priceId) {
      throw new Error(`No price ID configured for tier: ${tier}. Please set STRIPE_${tier.toUpperCase()}_PRICE_ID in your environment variables.`)
    }

    // Validate that price ID looks correct (should start with 'price_')
    if (!plan.priceId.startsWith('price_')) {
      throw new Error(`Invalid price ID format for ${tier}: ${plan.priceId}. Price IDs should start with 'price_', not 'prod_'. Please check your Stripe Dashboard.`)
    }

    const session = await stripeInstance.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
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
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    } as Stripe.Checkout.SessionCreateParams)

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
    const stripeInstance = getStripeInstance()
    const session = await stripeInstance.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    })
    return session
  },

  // Get subscription details
  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const stripeInstance = getStripeInstance()
      const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      return null
    }
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      const stripeInstance = getStripeInstance()
      const subscription = await stripeInstance.subscriptions.update(subscriptionId, {
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
      const stripeInstance = getStripeInstance()
      const subscription = await stripeInstance.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })
      return subscription
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      return null
    }
  }
}

// Export Stripe getter function for API routes
export const getStripe = getStripeInstance

// Backward compatibility - keep existing PRO_PLAN constants
export const PRO_PLAN_PRICE_ID = STRIPE_CONFIG.PLANS.pro.priceId
export const PRO_PLAN_AMOUNT = STRIPE_CONFIG.PLANS.pro.price