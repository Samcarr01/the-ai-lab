'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { stripeService } from '@/lib/stripe-client'

export default function UpgradePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { user: authUser, error } = await auth.getUser()
        
        if (error || !authUser) {
          router.push('/login')
          return
        }

        const userProfile = await userService.getProfile(authUser.id)
        if (userProfile) {
          setUser(userProfile)
          // If already pro, redirect to dashboard
          if (userProfile.is_pro) {
            router.push('/dashboard')
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  // Check for URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('upgrade') === 'cancelled') {
      setCancelled(true)
    }
  }, [])

  const handleUpgrade = async () => {
    if (upgrading) return

    setUpgrading(true)
    setError(null)

    try {
      await stripeService.upgradeUser()
    } catch (err) {
      console.error('Upgrade failed:', err)
      setError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Header */}
      <header className="glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🤖</span>
              </div>
              <span className="text-xl font-semibold text-gradient">thehackai</span>
            </Link>
            
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Upgrade Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Unlock Everything! ⚡
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Upgrade to Pro and get full access to all GPTs and playbooks in my personal collection.
        </p>

        {/* Cancelled Message */}
        {cancelled && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Payment was cancelled. You can try again anytime! 😊
            </p>
          </div>
        )}

        {/* Pricing Card */}
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-purple-100 mb-12">
          <div className="gradient-purple rounded-2xl p-6 text-white mb-6">
            <h3 className="text-2xl font-bold mb-2">Pro Membership</h3>
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold">£15</span>
              <span className="text-xl ml-2">/month</span>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-gray-700">Direct access to all 7 GPTs</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-gray-700">Download PDF playbooks (collection growing)</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-gray-700">New content as I add it</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-gray-700">Quality over quantity approach</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-600 text-xl">✅</span>
              <span className="text-gray-700">Cancel anytime</span>
            </div>
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={upgrading}
            className={`w-full gradient-purple text-white py-4 px-6 rounded-xl text-lg font-semibold button-hover shadow-lg transition-all duration-200 ${
              upgrading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {upgrading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              'Upgrade Now with Stripe 🚀'
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-4">
            Secure payment • Cancel anytime • No hidden fees
          </p>
        </div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-50 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">🆓 Free (Current)</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Preview GPT descriptions</li>
              <li>• Preview document titles</li>
              <li>• Full blog access</li>
              <li>• Basic support</li>
            </ul>
          </div>
          
          <div className="gradient-purple-subtle rounded-2xl p-6 border-2 border-purple-200">
            <h4 className="text-lg font-semibold text-purple-900 mb-4">✨ Pro (Upgrade)</h4>
            <ul className="space-y-2 text-sm text-purple-700">
              <li>• Direct GPT links & access</li>
              <li>• Download all PDF guides</li>
              <li>• Full blog access</li>
              <li>• Priority support</li>
              <li>• Early access to new tools</li>
            </ul>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            Questions? <Link href="/contact" className="text-purple-600 hover:text-purple-700">Get in touch</Link> • 
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 ml-2">Continue with free account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}