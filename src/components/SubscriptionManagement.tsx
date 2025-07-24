'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { STRIPE_CONFIG, stripeClientHelpers } from '@/lib/stripe-config'
import { UserProfile, UserTier } from '@/lib/user'

interface SubscriptionManagementProps {
  user: UserProfile
  onUpdate?: () => void
}

export default function SubscriptionManagement({ user, onUpdate }: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const currentTier = user.user_tier || 'free'
  const planConfig = STRIPE_CONFIG.PLANS[currentTier]
  const upgradeOptions = stripeClientHelpers.getUpgradeOptions(currentTier)

  const handleUpgrade = (tier: UserTier) => {
    router.push(`/checkout?tier=${tier}`)
  }

  const handleManageBilling = async () => {
    if (!user.stripe_customer_id) {
      setError('No billing information found')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      window.location.href = data.url
    } catch (error: any) {
      setError(error.message || 'Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/80 rounded-3xl p-6 shadow-lg border border-purple-500/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Current Plan</h3>
          <p className="text-gray-300 text-sm">Manage your subscription and billing</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">
              {currentTier === 'pro' ? '⚡' : currentTier === 'ultra' ? '🚀' : '🆓'}
            </span>
            <span className="text-lg font-semibold text-white">{planConfig.name}</span>
          </div>
          <p className="text-sm text-gray-400">{planConfig.description}</p>
        </div>
      </div>

      {/* Current Plan Details */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-white mb-3">Plan Features:</h4>
          <div className="space-y-2">
            {planConfig.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-white mb-3">Billing Info:</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <span className="text-gray-400">Price:</span>{' '}
              {planConfig.price === 0 ? 'Free' : `£${(planConfig.price / 100).toFixed(0)}/month`}
            </p>
            {user.subscription_status && (
              <p>
                <span className="text-gray-400">Status:</span>{' '}
                <span className={`capitalize ${
                  user.subscription_status === 'active' ? 'text-green-400' :
                  user.subscription_status === 'cancelled' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {user.subscription_status}
                </span>
              </p>
            )}
            {user.subscription_current_period_end && (
              <p>
                <span className="text-gray-400">
                  {user.subscription_cancel_at_period_end ? 'Ends:' : 'Renews:'}
                </span>{' '}
                {new Date(user.subscription_current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Upgrade Options */}
        {upgradeOptions.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {upgradeOptions.map((tier) => {
              const tierConfig = STRIPE_CONFIG.PLANS[tier]
              return (
                <button
                  key={tier}
                  onClick={() => handleUpgrade(tier)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 text-sm"
                >
                  Upgrade to {tierConfig.name} - £{(tierConfig.price / 100).toFixed(0)}/mo
                </button>
              )
            })}
          </div>
        )}

        {/* Billing Management */}
        {user.stripe_customer_id && currentTier !== 'free' && (
          <button
            onClick={handleManageBilling}
            disabled={loading}
            className="px-4 py-2 border border-purple-500 text-purple-300 font-medium rounded-lg hover:bg-purple-500/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Manage Billing'}
          </button>
        )}

        {/* View All Plans */}
        <button
          onClick={() => router.push('/upgrade')}
          className="px-4 py-2 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          View All Plans
        </button>
      </div>

      {/* Cancellation Warning */}
      {user.subscription_cancel_at_period_end && (
        <div className="mt-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">⚠️</span>
            <p className="text-yellow-200 text-sm">
              Your subscription will end on{' '}
              {new Date(user.subscription_current_period_end!).toLocaleDateString()}.
              You can reactivate anytime before then.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}