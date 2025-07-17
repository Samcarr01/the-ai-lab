'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SmartNavigation from '@/components/SmartNavigation'
import { STRIPE_CONFIG } from '@/lib/stripe'
import { UserTier } from '@/lib/user'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams?.get('tier') as UserTier || 'pro'
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserProfile(profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [router, supabase])

  const planConfig = STRIPE_CONFIG.PLANS[tier]

  if (loading) {
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
    <div className="min-h-screen bg-white">
      <SmartNavigation user={userProfile} />
      
      <div className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Animation */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-gradient">{planConfig.name}!</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your subscription has been activated successfully. You now have access to all {planConfig.name} features!
            </p>
          </div>

          {/* Plan Summary */}
          <div className="glass rounded-3xl p-8 mb-8 border-2 border-green-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-3xl">
                    {tier === 'pro' ? '⚡' : '🚀'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{planConfig.name} Plan</h2>
                  <p className="text-purple-600 font-medium">{planConfig.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  £{(planConfig.price / 100).toFixed(0)}
                </p>
                <p className="text-gray-600">per month</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {planConfig.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600">✓</span>
                  </div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-purple-50 border border-purple-200 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              🚀 What's Next?
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Explore GPTs</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Access our curated collection of powerful AI tools for your business.
                </p>
                <button
                  onClick={() => router.push('/gpts')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  Browse GPTs
                </button>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Download Playbooks</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Get our comprehensive guides and implement proven AI workflows.
                </p>
                <button
                  onClick={() => router.push('/documents')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  View Playbooks
                </button>
              </div>
            </div>
          </div>

          {/* Account Management */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Need to manage your subscription? Visit your dashboard to update billing, cancel, or upgrade.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105"
              >
                Go to Dashboard
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/stripe/create-portal-session', {
                      method: 'POST',
                    })
                    const data = await response.json()
                    if (data.url) {
                      window.location.href = data.url
                    }
                  } catch (error) {
                    console.error('Error creating portal session:', error)
                  }
                }}
                className="px-6 py-3 border border-purple-600 text-purple-600 font-medium rounded-xl hover:bg-purple-50 transition-colors"
              >
                Manage Billing
              </button>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Have questions? Our support team is here to help!
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <a 
                href="mailto:support@thehackai.com" 
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                📧 Email Support
              </a>
              <a 
                href="/contact" 
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                💬 Contact Form
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <SmartNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}