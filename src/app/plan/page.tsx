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

  const handleUpgrade = async (tier: UserTier) => {
    setUpgrading(tier)
    try {
      router.push(`/checkout?tier=${tier}`)
    } catch (error) {
      console.error('Upgrade error:', error)
      setUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    setManaging(true)
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url // Use location.href instead of window.open
      } else {
        console.error('Failed to create billing portal session')
        alert('Unable to open billing portal. Please try again.')
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      alert('Unable to open billing portal. Please try again.')
    } finally {
      setManaging(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        alert('Your subscription will be cancelled at the end of the current billing period.')
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`Failed to cancel subscription: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Cancel error:', error)
      alert('Unable to cancel subscription. Please try again.')
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Your Plan</h1>
          <p className="text-xl text-gray-300">
            Manage your subscription and upgrade options
          </p>
        </div>

        {/* Current Plan - Simplified */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-purple-500/30">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
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
            
            <h2 className="text-3xl font-bold text-white mb-2">{currentPlan.name} Plan</h2>
            <div className="text-2xl font-bold text-purple-400 mb-4">
              {currentPlan.price === 0 ? 'Free' : `£${currentPlan.price / 100}/month`}
            </div>
            <p className="text-gray-300 text-lg">{currentPlan.description}</p>
          </div>

          {/* What's Included */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">What's Included:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            {/* Upgrade Options */}
            {currentTier === 'free' && (
              <>
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={upgrading === 'pro'}
                  className="gradient-purple text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
                >
                  {upgrading === 'pro' ? 'Processing...' : 'Upgrade to Pro £7'}
                </button>
                <button
                  onClick={() => handleUpgrade('ultra')}
                  disabled={upgrading === 'ultra'}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg"
                >
                  {upgrading === 'ultra' ? 'Processing...' : 'Upgrade to Ultra £19'}
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
                  {upgrading === 'ultra' ? 'Processing...' : 'Upgrade to Ultra £19'}
                </button>
                <button
                  onClick={handleManageBilling}
                  disabled={managing}
                  className="bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                >
                  {managing ? 'Opening...' : 'Manage Billing'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="bg-red-900/50 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-900/70 transition-colors border border-red-500/30"
                >
                  Cancel Plan
                </button>
              </>
            )}

            {currentTier === 'ultra' && (
              <>
                <button
                  onClick={handleManageBilling}
                  disabled={managing}
                  className="bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                >
                  {managing ? 'Opening...' : 'Manage Billing'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="bg-red-900/50 text-red-300 px-6 py-3 rounded-xl font-semibold hover:bg-red-900/70 transition-colors border border-red-500/30"
                >
                  Cancel Plan
                </button>
              </>
            )}
          </div>
        </div>

        {/* Other Plans - Only for Free users */}
        {currentTier === 'free' && (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-6">Or choose a different plan:</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-white mb-2">Pro</h4>
                  <div className="text-2xl font-bold text-purple-400 mb-2">£7/month</div>
                  <p className="text-gray-300 text-sm">Daily AI Use</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-gray-200">3 essential GPTs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-gray-200">2 core playbooks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-gray-200">Email support</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={upgrading === 'pro'}
                  className="w-full gradient-purple text-white py-3 px-4 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  {upgrading === 'pro' ? 'Processing...' : 'Choose Pro'}
                </button>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-white mb-2">Ultra</h4>
                  <div className="text-2xl font-bold text-purple-400 mb-2">£19/month</div>
                  <p className="text-gray-300 text-sm">Full AI Access</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-gray-200">All 7 GPTs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-gray-200">All playbooks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-purple-400">✓</span>
                    <span className="text-gray-200">Priority support</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('ultra')}
                  disabled={upgrading === 'ultra'}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  {upgrading === 'ultra' ? 'Processing...' : 'Choose Ultra'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                  onClick={handleCancel}
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