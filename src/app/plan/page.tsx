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
  const [managing, setManaging] = useState(false)
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

  const handleUpgrade = async (tier: UserTier, event?: React.MouseEvent) => {
    event?.preventDefault()
    console.log('Upgrade button clicked for tier:', tier)
    setUpgrading(tier)
    try {
      console.log('Redirecting to checkout...')
      router.push(`/checkout?tier=${tier}`)
    } catch (error) {
      console.error('Upgrade error:', error)
      alert(`Failed to redirect to checkout: ${error}`)
      setUpgrading(null)
    }
  }

  const handleManageBilling = async (event?: React.MouseEvent) => {
    event?.preventDefault()
    console.log('Manage billing button clicked')
    setManaging(true)
    try {
      console.log('Calling create-portal-session API...')
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('Portal session response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Portal session data:', data)
        if (data.url) {
          console.log('Redirecting to portal:', data.url)
          window.location.href = data.url
        } else {
          console.error('No URL in response:', data)
          alert('No billing portal URL received. Please try again.')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Portal session failed:', response.status, errorData)
        alert(`Unable to open billing portal: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      alert(`Network error: ${error}`)
    } finally {
      setManaging(false)
    }
  }

  const handleCancel = async (event?: React.MouseEvent) => {
    event?.preventDefault()
    console.log('Cancel subscription button clicked')
    setCancelling(true)
    try {
      console.log('Calling subscription cancel API...')
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('Cancel response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Cancel response:', data)
        alert('Your subscription will be cancelled at the end of the current billing period.')
        window.location.reload()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Cancel failed:', response.status, errorData)
        alert(`Failed to cancel subscription: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert(`Network error: ${error}`)
    } finally {
      setCancelling(false)
      setShowCancelConfirm(false)
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
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Your Plan</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Manage your subscription and explore upgrade options
          </p>
        </div>

        {/* Current Plan - Enhanced */}
        <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 mb-12 border border-purple-500/30 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="lg:w-2/3 mb-8 lg:mb-0">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  currentTier === 'ultra' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : currentTier === 'pro'
                      ? 'bg-purple-900/50 border border-purple-500/30'
                      : 'bg-gray-800/50 border border-gray-600/30'
                }`}>
                  <span className="text-3xl">
                    {currentTier === 'ultra' ? '🚀' : currentTier === 'pro' ? '✨' : '🆓'}
                  </span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">{currentPlan.name} Plan</h2>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-purple-400">
                      {currentPlan.price === 0 ? 'Free' : `£${currentPlan.price / 100}`}
                    </span>
                    {currentPlan.price > 0 && (
                      <span className="text-gray-400">per month</span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 text-lg mb-6">{currentPlan.description}</p>

              {/* Features in a more compact layout */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">What's included:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-200 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons - Sidebar */}
            <div className="lg:w-1/3 lg:pl-8">
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Manage Plan</h3>
                <div className="space-y-3">
                  {/* Upgrade Options */}
                  {currentTier === 'free' && (
                    <>
                      <button
                        onClick={(e) => handleUpgrade('pro', e)}
                        disabled={upgrading === 'pro'}
                        className="w-full gradient-purple text-white px-4 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg text-sm"
                      >
                        {upgrading === 'pro' ? 'Processing...' : 'Upgrade to Pro - £7/month'}
                      </button>
                      <button
                        onClick={(e) => handleUpgrade('ultra', e)}
                        disabled={upgrading === 'ultra'}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg text-sm"
                      >
                        {upgrading === 'ultra' ? 'Processing...' : 'Upgrade to Ultra - £19/month'}
                      </button>
                    </>
                  )}

                  {currentTier === 'pro' && (
                    <>
                      <button
                        onClick={(e) => handleUpgrade('ultra', e)}
                        disabled={upgrading === 'ultra'}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg text-sm"
                      >
                        {upgrading === 'ultra' ? 'Processing...' : 'Upgrade to Ultra - £19/month'}
                      </button>
                      <button
                        onClick={(e) => handleManageBilling(e)}
                        disabled={managing}
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors text-sm"
                      >
                        {managing ? 'Opening...' : 'Manage Billing'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          console.log('Cancel subscription button clicked')
                          setShowCancelConfirm(true)
                        }}
                        className="w-full bg-red-900/50 text-red-300 px-4 py-3 rounded-xl font-semibold hover:bg-red-900/70 transition-colors border border-red-500/30 text-sm"
                      >
                        Cancel Subscription
                      </button>
                    </>
                  )}

                  {currentTier === 'ultra' && (
                    <>
                      <div className="text-center text-green-400 font-semibold mb-2">
                        ✨ Highest Plan ✨
                      </div>
                      <button
                        onClick={(e) => handleManageBilling(e)}
                        disabled={managing}
                        className="w-full bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors text-sm"
                      >
                        {managing ? 'Opening...' : 'Manage Billing'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          console.log('Cancel subscription button clicked')
                          setShowCancelConfirm(true)
                        }}
                        className="w-full bg-red-900/50 text-red-300 px-4 py-3 rounded-xl font-semibold hover:bg-red-900/70 transition-colors border border-red-500/30 text-sm"
                      >
                        Cancel Subscription
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Plans Comparison */}
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">All Available Plans</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(STRIPE_CONFIG.PLANS).map(([tier, plan]) => (
              <div
                key={tier}
                className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border transition-all hover:scale-105 relative ${
                  tier === currentTier
                    ? 'border-purple-500/50 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10'
                    : 'border-purple-500/30'
                }`}
              >
                {tier === currentTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="gradient-purple text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Your Current Plan
                    </span>
                  </div>
                )}
                
                {tier === 'pro' && tier !== currentTier && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6 pt-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                    tier === 'ultra' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                    tier === 'pro' ? 'bg-purple-900/50 border border-purple-500/30' :
                    'bg-gray-800/50 border border-gray-600/30'
                  }`}>
                    <span className="text-2xl">
                      {tier === 'ultra' ? '🚀' : tier === 'pro' ? '✨' : '🆓'}
                    </span>
                  </div>
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
                    onClick={(e) => handleUpgrade(tier as UserTier, e)}
                    disabled={upgrading === tier}
                    className={`w-full py-3 px-4 rounded-xl font-semibold hover:scale-105 transition-transform text-sm ${
                      tier === 'ultra' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'gradient-purple text-white'
                    }`}
                  >
                    {upgrading === tier ? 'Processing...' : `Choose ${plan.name}`}
                  </button>
                )}
                
                {tier === currentTier && (
                  <div className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-green-900/30 text-green-300 border border-green-500/30 text-center">
                    ✓ Current Plan
                  </div>
                )}
                
                {tier === 'free' && currentTier !== 'free' && (
                  <div className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gray-700/50 text-gray-400 text-center">
                    Contact Support to Downgrade
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-red-500/30">
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
                  Keep Plan
                </button>
                <button
                  onClick={(e) => handleCancel(e)}
                  disabled={cancelling}
                  className="flex-1 bg-red-900 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-800 transition-colors"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Plan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DarkThemeBackground>
  )
}