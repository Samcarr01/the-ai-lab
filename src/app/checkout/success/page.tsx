'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SmartNavigation from '@/components/SmartNavigation'
import { STRIPE_CONFIG } from '@/lib/stripe-config'
import { UserTier } from '@/lib/user'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams?.get('tier') as UserTier || 'pro'
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const supabase = createClient()
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
  }, [router])

  const planConfig = STRIPE_CONFIG.PLANS[tier]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <SmartNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <SmartNavigation user={userProfile} />
      
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20 animate-pulse">
              <span className="text-white text-5xl">✓</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              🎉 Welcome to <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{planConfig.name}!</span>
            </h1>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Your payment was successful! You now have access to all {planConfig.name} features.
            </p>
          </div>

          {/* Plan Summary Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 mb-12 border border-gray-200/50 shadow-2xl shadow-purple-500/10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-4xl">
                    {tier === 'pro' ? '⚡' : '🚀'}
                  </span>
                </div>
                <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-gray-900">{planConfig.name} Plan</h2>
                  <p className="text-purple-600 font-semibold text-lg">{planConfig.description}</p>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  £{(planConfig.price / 100).toFixed(0)}
                </p>
                <p className="text-gray-600 text-lg font-medium">per month</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {planConfig.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-7 h-7 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-800 font-medium text-lg">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* GPTs Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-10 text-white shadow-2xl shadow-purple-500/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Explore Premium GPTs</h3>
              <p className="text-purple-100 text-lg mb-8 leading-relaxed">
                Access our curated collection of {tier === 'ultra' ? '7' : '3'} powerful AI tools that will transform your workflow and boost productivity.
              </p>
              <button
                onClick={() => router.push('/gpts')}
                className="w-full h-14 bg-white text-purple-700 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-200 hover:scale-105 text-lg"
              >
                Browse GPTs →
              </button>
            </div>

            {/* Playbooks Card */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-10 text-white shadow-2xl shadow-blue-500/20">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Download Playbooks</h3>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Get instant access to our premium playbook collection with battle-tested strategies and actionable insights.
              </p>
              <button
                onClick={() => router.push('/documents')}
                className="w-full h-14 bg-white text-blue-700 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-200 hover:scale-105 text-lg"
              >
                Get Playbooks →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-12 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">🚀 Ready to Get Started?</h2>
            <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Your {planConfig.name} subscription is now active. Start exploring premium content and transform your AI workflow today!
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 shadow-xl"
              >
                🏠 Go to Dashboard
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
                className="bg-white text-gray-800 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-xl"
              >
                💳 Manage Billing
              </button>
            </div>
            
            {/* Support Links */}
            <div className="border-t border-gray-700 pt-8">
              <p className="text-gray-400 text-sm mb-4">
                Need help? Our support team is here for you!
              </p>
              <div className="flex items-center justify-center gap-8 text-sm">
                <a 
                  href="mailto:support@thehackai.com" 
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  📧 Email Support
                </a>
                <a 
                  href="/contact" 
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  💬 Contact Form
                </a>
              </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
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