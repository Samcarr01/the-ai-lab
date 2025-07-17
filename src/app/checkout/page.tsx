'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { getStripe } from '@/lib/stripe'
import SmartNavigation from '@/components/SmartNavigation'
import { STRIPE_CONFIG } from '@/lib/stripe'
import { UserTier } from '@/lib/user'

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams?.get('tier') as UserTier || 'pro'
  const canceled = searchParams?.get('canceled') === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/checkout')
        return
      }
      setUser(user)
    })
  }, [router, supabase])

  const handleCheckout = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const stripe = await getStripe()
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const planConfig = STRIPE_CONFIG.PLANS[tier]
  const otherTier = tier === 'pro' ? 'ultra' : 'pro'
  const otherPlan = STRIPE_CONFIG.PLANS[otherTier]

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <SmartNavigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <SmartNavigation />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Complete Your <span className="text-gradient">Upgrade</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Secure checkout powered by Stripe with Apple Pay, Google Pay, and card payments
            </p>
          </div>

          {/* Canceled Message */}
          {canceled && (
            <div className="max-w-2xl mx-auto mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-yellow-500 text-xl">⚠️</span>
                <div>
                  <h3 className="font-medium text-yellow-800">Payment Canceled</h3>
                  <p className="text-yellow-700 text-sm">
                    No worries! You can complete your upgrade anytime. Your account remains unchanged.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Selected Plan */}
            <div className="order-2 lg:order-1">
              <div className="glass rounded-3xl p-8 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-2xl">
                      {tier === 'pro' ? '⚡' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{planConfig.name}</h2>
                    <p className="text-purple-600 font-medium">{planConfig.description}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      £{(planConfig.price / 100).toFixed(0)}
                    </span>
                    <span className="text-lg text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Cancel anytime • No commitment • Instant access
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {planConfig.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating secure checkout...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>Continue to Secure Checkout</span>
                      <span className="text-lg">🔒</span>
                    </div>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="text-center text-sm text-gray-500 mb-4">
                  <p>Supported payment methods:</p>
                </div>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-lg">💳</span>
                    <span className="text-sm text-gray-700">Cards</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-lg">🍎</span>
                    <span className="text-sm text-gray-700">Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-lg">🔵</span>
                    <span className="text-sm text-gray-700">Google Pay</span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span className="text-green-500">🔒</span>
                  <span>Secured by Stripe • SSL encrypted</span>
                </div>
              </div>
            </div>

            {/* Alternative Plan */}
            <div className="order-1 lg:order-2">
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">
                      {otherTier === 'pro' ? '⚡' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{otherPlan.name}</h3>
                    <p className="text-gray-600 text-sm">{otherPlan.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      £{(otherPlan.price / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {otherPlan.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-xs">✓</span>
                      </div>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                  {otherPlan.features.length > 3 && (
                    <p className="text-gray-500 text-xs pl-6">
                      +{otherPlan.features.length - 3} more features
                    </p>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/checkout?tier=${otherTier}`)}
                  className="w-full h-10 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Switch to {otherPlan.name}
                </button>
              </div>

              {/* Trust Signals */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>Cancel anytime, no questions asked</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>Instant access after payment</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600 text-sm">
                  Yes! Cancel your subscription anytime from your dashboard. You'll retain access until the end of your billing period.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Is my payment information secure?</h4>
                <p className="text-gray-600 text-sm">
                  Absolutely. We use Stripe for payment processing, which is PCI DSS compliant and trusted by millions of businesses worldwide.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Can I upgrade or downgrade later?</h4>
                <p className="text-gray-600 text-sm">
                  Yes! You can change your plan anytime from your dashboard. Changes take effect at your next billing cycle.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
                <p className="text-gray-600 text-sm">
                  We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}