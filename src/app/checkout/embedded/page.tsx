'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import SmartNavigation from '@/components/SmartNavigation'
import { UserTier } from '@/lib/user'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function EmbeddedCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = searchParams?.get('tier') as UserTier || 'pro'
  const [user, setUser] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    // Get current user and create checkout session
    const initializeCheckout = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/checkout/embedded')
        return
      }
      
      setUser(user)

      // Create embedded checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (response.ok) {
        const data = await response.json()
        setClientSecret(data.client_secret)
      } else {
        console.error('Failed to create checkout session')
        router.push(`/checkout?tier=${tier}`)
      }
    }

    initializeCheckout()
  }, [router, tier])

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#7C3AED', // purple-600
        colorBackground: '#ffffff',
        colorText: '#1f2937', // gray-800
        colorDanger: '#dc2626', // red-600
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '6px',
        borderRadius: '12px',
      },
      rules: {
        '.Tab': {
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        },
        '.Tab:hover': {
          borderColor: '#7C3AED',
          boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.1)',
        },
        '.Tab--selected': {
          borderColor: '#7C3AED',
          backgroundColor: '#f3f4f6',
        },
        '.Input': {
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          fontSize: '16px',
          padding: '12px',
        },
        '.Input:focus': {
          borderColor: '#7C3AED',
          boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)',
        },
        '.SubmitButton': {
          backgroundColor: '#7C3AED',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          padding: '12px 24px',
          boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.2)',
        },
        '.SubmitButton:hover': {
          backgroundColor: '#6D28D9',
          transform: 'translateY(-1px)',
          boxShadow: '0 8px 15px -3px rgba(124, 58, 237, 0.3)',
        },
      },
    },
  }

  if (!user || !clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <SmartNavigation user={user} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <SmartNavigation user={user} />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Complete Your <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Upgrade</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Secure embedded checkout with full brand consistency
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-200/50 shadow-2xl shadow-purple-500/10">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmbeddedCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    }>
      <EmbeddedCheckoutContent />
    </Suspense>
  )
}