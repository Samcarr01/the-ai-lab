import { getStripe } from './stripe-config'

export const stripeService = {
  async createCheckoutSession(): Promise<{ sessionId: string; url: string }> {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create checkout session')
    }

    return response.json()
  },

  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await getStripe()
    
    if (!stripe) {
      throw new Error('Stripe failed to load')
    }

    const { error } = await stripe.redirectToCheckout({ sessionId })
    
    if (error) {
      throw new Error(error.message)
    }
  },

  async upgradeUser(): Promise<void> {
    try {
      const { sessionId } = await this.createCheckoutSession()
      await this.redirectToCheckout(sessionId)
    } catch (error) {
      console.error('Upgrade error:', error)
      throw error
    }
  }
}