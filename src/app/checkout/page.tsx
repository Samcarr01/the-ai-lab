'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe-config'
import SmartNavigation from '@/components/SmartNavigation'
import { UserTier } from '@/lib/user'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams?.get('tier') as UserTier || 'pro'
  const canceled = searchParams?.get('canceled') === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check authentication
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/checkout')
        return
      }
      setUser(user)
    })
  }, [router])

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
        <SmartNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <SmartNavigation user={user} />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Complete Your <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Upgrade</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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

          <div className="grid lg:grid-cols-3 gap-8 items-start max-w-7xl mx-auto">
            {/* Selected Plan */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 border border-gray-200/50 shadow-2xl shadow-purple-500/10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-3xl">
                      {tier === 'pro' ? '⚡' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{planConfig.name}</h2>
                    <p className="text-purple-600 font-semibold text-lg">{planConfig.description}</p>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      £{(planConfig.price / 100).toFixed(0)}
                    </span>
                    <span className="text-2xl text-gray-600 font-medium">/month</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Cancel anytime
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      No commitment
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Instant access
                    </span>
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  {planConfig.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <span className="text-gray-800 font-medium text-lg">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-16 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white font-bold rounded-2xl hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6 text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="text-lg">Creating secure checkout...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-lg">Continue to Secure Checkout</span>
                      <span className="text-xl">🔒</span>
                    </div>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-red-500 text-xl">⚠️</span>
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                <div className="text-center text-lg text-gray-600 mb-6">
                  <p className="font-medium">Supported payment methods:</p>
                </div>
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200">
                    <span className="text-2xl">💳</span>
                    <span className="text-sm font-medium text-gray-700">All Cards</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200">
                    <span className="text-2xl">🍎</span>
                    <span className="text-sm font-medium text-gray-700">Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200">
                    <span className="text-2xl">🔵</span>
                    <span className="text-sm font-medium text-gray-700">Google Pay</span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-3 text-gray-600 bg-green-50/50 rounded-xl p-4 border border-green-200/50">
                  <span className="text-green-600 text-xl">🔒</span>
                  <span className="font-medium">Secured by Stripe • SSL encrypted • Bank-level security</span>
                </div>
              </div>
            </div>

            {/* Alternative Plan */}
            <div className="order-1 lg:order-2">
              <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">
                      {otherTier === 'pro' ? '⚡' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{otherPlan.name}</h3>
                    <p className="text-gray-600 font-medium">{otherPlan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      £{(otherPlan.price / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-600 text-lg">/month</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {otherPlan.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-xs font-bold">✓</span>
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                  {otherPlan.features.length > 3 && (
                    <p className="text-gray-500 text-sm pl-8">
                      +{otherPlan.features.length - 3} more features
                    </p>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/checkout?tier=${otherTier}`)}
                  className="w-full h-12 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-semibold rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all duration-200 hover:scale-105"
                >
                  Switch to {otherPlan.name}
                </button>
              </div>

              {/* Trust Signals */}
              <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Why choose us?</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="text-gray-700 font-medium">30-day money-back guarantee</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="text-gray-700 font-medium">Cancel anytime, no questions asked</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="text-gray-700 font-medium">Instant access after payment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-lg">✓</span>
                    <span className="text-gray-700 font-medium">24/7 customer support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-12">Frequently Asked Questions</h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-lg text-left">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Can I cancel anytime?</h4>
                <p className="text-gray-700 leading-relaxed">
                  Yes! Cancel your subscription anytime from your dashboard. You'll retain access until the end of your billing period.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-lg text-left">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Is my payment information secure?</h4>
                <p className="text-gray-700 leading-relaxed">
                  Absolutely. We use Stripe for payment processing, which is PCI DSS compliant and trusted by millions of businesses worldwide.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-lg text-left">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Can I upgrade or downgrade later?</h4>
                <p className="text-gray-700 leading-relaxed">
                  Yes! You can change your plan anytime from your dashboard. Changes take effect at your next billing cycle.
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 shadow-lg text-left">
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Do you offer refunds?</h4>
                <p className="text-gray-700 leading-relaxed">
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <SmartNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}