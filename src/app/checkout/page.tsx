'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe-config'
import SmartNavigation from '@/components/SmartNavigation'
import DarkThemeBackground from '@/components/DarkThemeBackground'
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
    // Check authentication and user status
    const checkUserAndRedirect = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/checkout')
        return
      }
      
      // Check user's current tier to prevent inappropriate access
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_tier')
        .eq('id', user.id)
        .single()
      
      const currentTier = userProfile?.user_tier || 'free'
      
      // If user is already Pro and trying to access Pro checkout, redirect to Ultra
      if (currentTier === 'pro' && tier === 'pro') {
        router.push('/checkout?tier=ultra')
        return
      }
      
      // If user is already Ultra, redirect to plan management
      if (currentTier === 'ultra') {
        router.push('/plan')
        return
      }
      
      setUser(user)
    }
    
    checkUserAndRedirect()
  }, [router, tier])

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
      <DarkThemeBackground>
        <SmartNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-white">Loading checkout...</p>
          </div>
        </div>
      </DarkThemeBackground>
    )
  }

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Complete Your <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Upgrade</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
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

          <div className="grid lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
            {/* Selected Plan */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">
                      {tier === 'pro' ? '⚡' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{planConfig.name}</h2>
                    <p className="text-purple-400 font-medium">{planConfig.description}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                      £{(planConfig.price / 100).toFixed(0)}
                    </span>
                    <span className="text-lg text-gray-300">/month</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Cancel anytime
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      No commitment
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Instant access
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {planConfig.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="text-gray-200 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating secure checkout...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Continue to Secure Checkout</span>
                      <span>🔒</span>
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
                <div className="text-center text-gray-300 mb-4">
                  <p className="text-sm font-medium">Supported payment methods:</p>
                </div>
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg border border-purple-500/30">
                    <span className="text-lg">💳</span>
                    <span className="text-xs font-medium text-gray-200">Cards</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg border border-purple-500/30">
                    <span className="text-lg">🍎</span>
                    <span className="text-xs font-medium text-gray-200">Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg border border-purple-500/30">
                    <span className="text-lg">🔵</span>
                    <span className="text-xs font-medium text-gray-200">Google Pay</span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-gray-200 bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                  <span className="text-green-400">🔒</span>
                  <span className="text-sm font-medium">Secured by Stripe • SSL encrypted</span>
                </div>
              </div>
            </div>

            {/* Alternative Plan */}
            <div className="order-1 lg:order-2">
              <div className="bg-slate-800/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">
                      {otherTier === 'pro' ? '⚡' : '🚀'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{otherPlan.name}</h3>
                    <p className="text-gray-300 text-sm">{otherPlan.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">
                      £{(otherPlan.price / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-300">/month</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {otherPlan.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-300 text-xs">✓</span>
                      </div>
                      <span className="text-gray-200 text-sm">{feature}</span>
                    </div>
                  ))}
                  {otherPlan.features.length > 3 && (
                    <p className="text-gray-400 text-xs pl-6">
                      +{otherPlan.features.length - 3} more features
                    </p>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/checkout?tier=${otherTier}`)}
                  className="w-full h-10 bg-slate-700 text-gray-200 font-medium rounded-lg hover:bg-slate-600 transition-colors text-sm"
                >
                  Switch to {otherPlan.name}
                </button>
              </div>

              {/* Trust Signals */}
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Why choose us?</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700 text-sm">Industry-leading AI tools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700 text-sm">Cancel anytime, no questions asked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700 text-sm">Instant access after payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-700 text-sm">24/7 customer support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-lg text-left">
                <h4 className="font-bold text-white mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-200 text-sm">
                  Yes! Cancel your subscription anytime from your dashboard. You'll retain access until the end of your billing period.
                </p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-lg text-left">
                <h4 className="font-bold text-white mb-2">Is my payment information secure?</h4>
                <p className="text-gray-200 text-sm">
                  Absolutely. We use Stripe for payment processing, which is PCI DSS compliant and trusted by millions of businesses worldwide.
                </p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-lg text-left">
                <h4 className="font-bold text-white mb-2">Can I upgrade or downgrade later?</h4>
                <p className="text-gray-200 text-sm">
                  Yes! You can change your plan anytime from your dashboard. Changes take effect at your next billing cycle.
                </p>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 shadow-lg text-left">
                <h4 className="font-bold text-white mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-200 text-sm">
                  Yes! You have complete control over your subscription. Cancel anytime from your dashboard with no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DarkThemeBackground>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <DarkThemeBackground>
        <SmartNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DarkThemeBackground>
    }>
      <CheckoutContent />
    </Suspense>
  )
}