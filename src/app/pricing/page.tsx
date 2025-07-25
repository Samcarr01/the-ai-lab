'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile, type UserTier } from '@/lib/user'
import { STRIPE_CONFIG } from '@/lib/stripe-config'
import SmartNavigation from '@/components/SmartNavigation'
import DarkThemeBackground from '@/components/DarkThemeBackground'

export default function PricingPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<UserTier | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { user: authUser, error } = await auth.getUser()
        
        if (!error && authUser) {
          // Get user profile if logged in
          let userProfile = await userService.getProfile(authUser.id)
          if (!userProfile) {
            userProfile = await userService.createProfile(authUser.id, authUser.email || '')
          }
          setUser(userProfile)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleUpgrade = async (tier: UserTier) => {
    if (!user) {
      router.push('/signup')
      return
    }

    setUpgrading(tier)
    try {
      // Redirect to checkout page with the selected tier
      router.push(`/checkout?tier=${tier}`)
    } catch (error) {
      console.error('Upgrade error:', error)
      setUpgrading(null)
    }
  }

  const plans = [
    {
      tier: 'free' as UserTier,
      name: 'Free',
      price: '£0',
      period: 'forever',
      description: 'Get started with AI tools',
      features: [
        'Browse all GPTs and playbooks',
        'Read all blog posts',
        'Community access',
        'Preview descriptions'
      ],
      buttonText: 'Current Plan',
      buttonStyle: 'bg-gray-600 text-gray-300 cursor-not-allowed',
      popular: false
    },
    {
      tier: 'pro' as UserTier,
      name: 'Pro',
      price: '£7',
      period: 'per month',
      description: 'Essential AI tools for daily use',
      features: [
        'Everything in Free',
        'Access to 3 essential GPTs',
        'Download 2 core playbooks',
        'Email support',
        'Early access to new content'
      ],
      buttonText: 'Choose Pro',
      buttonStyle: 'gradient-purple text-white hover:scale-105 transition-transform',
      popular: true
    },
    {
      tier: 'ultra' as UserTier,
      name: 'Ultra',
      price: '£19',
      period: 'per month',
      description: 'Full access to scale your AI game',
      features: [
        'Everything in Pro',
        'Access to all 7 GPTs',
        'Download all playbooks',
        'Priority support',
        'Early access to new features',
        'Custom AI workflows'
      ],
      buttonText: 'Choose Ultra',
      buttonStyle: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 transition-transform',
      popular: false
    }
  ]

  // Update button text and style based on user's current tier
  const getUpdatedPlans = () => {
    const currentTier = user?.user_tier || 'free'
    
    return plans.map(plan => {
      if (plan.tier === currentTier) {
        return {
          ...plan,
          buttonText: 'Current Plan',
          buttonStyle: 'bg-gray-600 text-gray-300 cursor-not-allowed'
        }
      }
      
      if (plan.tier === 'free') {
        return {
          ...plan,
          buttonText: currentTier !== 'free' ? 'Downgrade' : 'Current Plan',
          buttonStyle: 'bg-gray-600 text-gray-300 cursor-not-allowed'
        }
      }
      
      return plan
    })
  }

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Choose Your AI Journey
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Battle-tested AI workflows that actually work. Get access to curated GPTs and playbooks 
            designed by experts who've tested them in real business scenarios.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {getUpdatedPlans().map((plan) => (
            <div
              key={plan.tier}
              className={`relative bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-purple-500/50 ring-2 ring-purple-500/20' 
                  : 'border-purple-500/30'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="gradient-purple text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-purple-400">{plan.price}</span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-300 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mt-1">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-200 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.tier)}
                disabled={upgrading === plan.tier || plan.buttonText === 'Current Plan' || plan.tier === 'free'}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all duration-200 ${plan.buttonStyle}`}
              >
                {upgrading === plan.tier ? 'Processing...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Cancel anytime, no questions asked. Complete control over your subscription.
          </p>
          <p className="text-gray-400 text-sm">
            Need help choosing? <a href="/contact" className="text-purple-400 hover:text-purple-300">Contact us</a>
          </p>
        </div>
      </div>
    </DarkThemeBackground>
  )
}