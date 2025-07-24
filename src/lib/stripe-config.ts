import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js'
import { UserTier } from './user'

// Client-side Stripe instance
let stripePromise: Promise<StripeJS | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// 3-Tier Stripe Configuration (Client-Safe)
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

// Client-safe helper functions (no server-side Stripe instance)
export const stripeClientHelpers = {
  // Get plan configuration by tier
  getPlanConfig(tier: UserTier) {
    return STRIPE_CONFIG.PLANS[tier]
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
  }
}

// Backward compatibility
export const PRO_PLAN_PRICE_ID = STRIPE_CONFIG.PLANS.pro.priceId
export const PRO_PLAN_AMOUNT = STRIPE_CONFIG.PLANS.pro.price