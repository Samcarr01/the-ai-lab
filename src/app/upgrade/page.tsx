'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile, type UserTier, TIER_FEATURES } from '@/lib/user'
import { stripeHelpers } from '@/lib/stripe'
import SmartNavigation from '@/components/SmartNavigation'

export default function UpgradePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<UserTier | null>(null)
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
    if (urlParams.get('cancelled') === 'true') {
      setCancelled(true)
    }
  }, [])

  const handleUpgrade = async (tier: UserTier) => {
    if (upgrading || !user) return

    setUpgrading(tier)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier,
          userId: user.id,
          userEmail: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Upgrade failed:', err)
      setError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.')
    } finally {
      setUpgrading(null)
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

  const currentTier = user.user_tier || 'free'
  const upgradeOptions = stripeHelpers.getUpgradeOptions(currentTier)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      <SmartNavigation user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Supercharge Your AI 🚀
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Battle-tested AI playbooks and GPTs that actually work. Upload our guides to any LLM (ChatGPT, Claude, Gemini, etc.) to instantly make it smarter at specific tasks - no months of trial and error needed.
          </p>
          
          {/* Current Tier Badge */}
          <div className="mt-8 inline-flex items-center px-4 py-2 bg-purple-100 rounded-full">
            <span className="text-purple-800 font-medium">
              Currently on {TIER_FEATURES[currentTier].name} plan
            </span>
          </div>
        </div>

        {/* Cancelled Message */}
        {cancelled && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800 text-center">
              Payment was cancelled. You can try again anytime! 😊
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {(Object.keys(TIER_FEATURES) as UserTier[]).map((tier) => {
            const config = TIER_FEATURES[tier]
            const isCurrentTier = currentTier === tier
            const canUpgrade = upgradeOptions.includes(tier)
            const isDowngrade = !canUpgrade && tier !== currentTier
            
            return (
              <div
                key={tier}
                className={`relative bg-white rounded-3xl p-8 shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  tier === 'pro' 
                    ? 'border-purple-300 scale-105' 
                    : tier === 'ultra'
                    ? 'border-purple-500'
                    : 'border-gray-200'
                } ${isCurrentTier ? 'ring-2 ring-purple-400' : ''}`}
              >
                {/* Popular Badge */}
                {tier === 'pro' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="gradient-purple text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentTier && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Current
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {config.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{config.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      £{config.price}
                    </span>
                    {config.price > 0 && (
                      <span className="text-xl text-gray-600 ml-2">/month</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-auto">
                  {isCurrentTier ? (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-xl text-lg font-semibold cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : canUpgrade ? (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      disabled={upgrading !== null}
                      className={`w-full gradient-purple text-white py-3 px-6 rounded-xl text-lg font-semibold button-hover shadow-lg transition-all duration-200 ${
                        upgrading === tier ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {upgrading === tier ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        `Upgrade to ${config.name}`
                      )}
                    </button>
                  ) : tier === 'free' ? (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-xl text-lg font-semibold cursor-not-allowed"
                    >
                      Cannot Downgrade
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-xl text-lg font-semibold cursor-not-allowed"
                    >
                      Lower Tier
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Content Breakdown */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Make Any AI Smarter at What You Need 🧠
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            {/* Free Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mt-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🆓 Free Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Browse & Explore:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Preview all GPT titles & descriptions</li>
                    <li>• Browse playbook summaries</li>
                    <li>• See what's inside before upgrading</li>
                    <li>• Full access to all blog content</li>
                  </ul>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-gray-500 italic">Perfect for exploring what we offer</span>
                </div>
              </div>
            </div>

            {/* Pro Content */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-300 relative mt-4">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">Most Popular</span>
              </div>
              <h3 className="text-xl font-semibold text-purple-900 mb-4">
                🚀 Pro - Daily AI Use
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3 Essential GPTs:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Email Enhancer - Professional writing</li>
                    <li>• PromptRefiner - Optimize AI prompts</li>
                    <li>• Better Ideerer - Enhanced brainstorming</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2 Core Playbooks:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Email Writing Mastery Guide</li>
                    <li>• GPT Prompting Fundamentals</li>
                  </ul>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-purple-600 italic">Perfect for daily productivity boost</span>
                </div>
              </div>
            </div>

            {/* Ultra Content */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-400 relative mt-4 ring-2 ring-pink-300 ring-opacity-50 animate-pulse">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">Best Value</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-900 mb-4">
                ⚡ Ultra - Upscale Your AI Game
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">All 7 GPTs:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Everything in Pro PLUS:</li>
                    <li>• SaaS Planner - Business strategy</li>
                    <li>• The Executor - Advanced automation</li>
                    <li>• PlaybookFlip - Content creation</li>
                    <li>• Marketing & business tools</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">All 4 Playbooks:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Everything in Pro PLUS:</li>
                    <li>• Advanced business automation</li>
                    <li>• Scaling & growth strategies</li>
                  </ul>
                </div>
                <div className="pt-2">
                  <span className="text-xs text-pink-600 italic">For serious AI power users</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How to Hack Your AI in 3 Steps 🔧
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Download</h3>
              <p className="text-gray-600">Get access to our battle-tested GPTs and PDF playbooks that have been proven to work.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Upload</h3>
              <p className="text-gray-600">Upload the PDFs to any LLM (ChatGPT, Claude, Gemini, etc.) as knowledge documents.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Supercharge</h3>
              <p className="text-gray-600">Your AI instantly becomes much better at specific tasks without months of trial and error.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600">Yes! You can upgrade from Free → Pro → Ultra anytime. Changes take effect immediately.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">What if I want to cancel?</h3>
              <p className="text-gray-600">You can cancel anytime. You'll keep access until the end of your billing period, then automatically switch to Free.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">How do the playbooks work with any LLM?</h3>
              <p className="text-gray-600">Download the PDFs and upload them as knowledge files. Your AI will reference them to provide expert-level assistance in specific domains.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-2">What makes these GPTs and playbooks "battle-tested"?</h3>
              <p className="text-gray-600">Every tool and guide has been personally used and refined through real-world application. No theory - just proven workflows that deliver results.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            Questions? <Link href="/contact" className="text-purple-600 hover:text-purple-700">Get in touch</Link> • 
            <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 ml-2">Back to Dashboard</Link>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Secure payments powered by Stripe • All plans include 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  )
}