'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile, type UserTier } from '@/lib/user'
import { STRIPE_CONFIG } from '@/lib/stripe-config'
import SmartNavigation from '@/components/SmartNavigation'
import DarkThemeBackground from '@/components/DarkThemeBackground'

export default function PlanPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<UserTier | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { user: authUser, error } = await auth.getUser()
        
        if (error || !authUser) {
          router.push('/login')
          return
        }

        // Get user profile
        let userProfile = await userService.getProfile(authUser.id)
        if (!userProfile) {
          userProfile = await userService.createProfile(authUser.id, authUser.email || '')
        }
        setUser(userProfile)
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  const handleUpgrade = async (tier: UserTier) => {
    setUpgrading(tier)
    try {
      router.push(`/checkout?tier=${tier}`)
    } catch (error) {
      console.error('Upgrade error:', error)
      setUpgrading(null)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      // Call cancel subscription API
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        // Refresh user data
        window.location.reload()
      } else {
        console.error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Cancel error:', error)
    } finally {
      setCancelling(false)
      setShowCancelConfirm(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
    }
  }

  if (loading) {
    return (
      <DarkThemeBackground>
        <SmartNavigation user={null} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-white">Loading your plan...</p>
        </div>
      </DarkThemeBackground>
    )
  }

  if (!user) {
    return null
  }

  const currentTier = user.user_tier || 'free'
  const currentPlan = STRIPE_CONFIG.PLANS[currentTier]

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Your Plan</h1>
          <p className="text-xl text-gray-300">
            Manage your subscription and see what's included
          </p>
        </div>

        {/* Current Plan Section */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-purple-500/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  currentTier === 'ultra' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : currentTier === 'pro'
                      ? 'bg-purple-900/50 border border-purple-500/30'
                      : 'bg-gray-800/50 border border-gray-600/30'
                }`}>
                  <span className="text-2xl">
                    {currentTier === 'ultra' ? '🚀' : currentTier === 'pro' ? '✨' : '🆓'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{currentPlan.name} Plan</h2>
                  <p className="text-gray-300">{currentPlan.description}</p>
                </div>
              </div>
              
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-3xl font-bold text-purple-400">
                  {currentPlan.price === 0 ? 'Free' : `£${currentPlan.price / 100}`}
                </span>
                {currentPlan.price > 0 && (
                  <span className="text-gray-400">per month</span>
                )}
              </div>

              {/* Plan Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-200 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 lg:ml-8">
              {currentTier === 'free' && (
                <>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={upgrading === 'pro'}
                    className="gradient-purple text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
                  >
                    {upgrading === 'pro' ? 'Processing...' : 'Upgrade to Pro - £7/month'}
                  </button>
                  <button
                    onClick={() => handleUpgrade('ultra')}
                    disabled={upgrading === 'ultra'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
                  >
                    {upgrading === 'ultra' ? 'Processing...' : 'Upgrade to Ultra - £19/month'}
                  </button>
                </>
              )}

              {currentTier === 'pro' && (
                <>
                  <button
                    onClick={() => handleUpgrade('ultra')}
                    disabled={upgrading === 'ultra'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
                  >
                    {upgrading === 'ultra' ? 'Processing...' : 'Upgrade to Ultra - £19/month'}
                  </button>
                  <button
                    onClick={handleManageBilling}
                    className="bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                  >
                    Manage Billing
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="bg-red-900/50 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-900/70 transition-colors border border-red-500/30"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}

              {currentTier === 'ultra' && (
                <>
                  <button
                    onClick={handleManageBilling}
                    className="bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                  >
                    Manage Billing
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="bg-red-900/50 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-900/70 transition-colors border border-red-500/30"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* All Plans Comparison */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Compare All Plans</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(STRIPE_CONFIG.PLANS).map(([tier, plan]) => (
              <div
                key={tier}
                className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border transition-all hover:scale-105 ${
                  tier === currentTier
                    ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                    : 'border-purple-500/30'
                }`}
              >
                {tier === currentTier && (
                  <div className="text-center mb-4">
                    <span className="gradient-purple text-white px-4 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-purple-400">
                      {plan.price === 0 ? 'Free' : `£${plan.price / 100}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400 text-sm ml-1">per month</span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-200 text-xs leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {tier !== currentTier && tier !== 'free' && (
                  <button
                    onClick={() => handleUpgrade(tier as UserTier)}
                    disabled={upgrading === tier}
                    className="w-full gradient-purple text-white py-2 px-4 rounded-xl font-semibold hover:scale-105 transition-transform text-sm"
                  >
                    {upgrading === tier ? 'Processing...' : `Choose ${plan.name}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4 border border-red-500/30">
              <h3 className="text-xl font-bold text-white mb-4">Cancel Subscription?</h3>
              <p className="text-gray-300 mb-6">
                Your subscription will remain active until the end of your current billing period. 
                You'll still have access to all {currentPlan.name} features until then.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 bg-red-900 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DarkThemeBackground>
  )
}