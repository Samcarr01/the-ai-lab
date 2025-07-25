import { NextRequest, NextResponse } from 'next/server'
import { getStripe, stripeHelpers } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { UserTier } from '@/lib/user'

export async function POST(request: NextRequest) {
  let tier: string | undefined
  let user: any
  
  try {
    const requestData = await request.json()
    tier = requestData.tier

    if (!tier || !['pro', 'ultra'].includes(tier)) {
      return NextResponse.json(
        { error: 'Valid tier (pro or ultra) is required' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    user = authUser

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate upgrade path
    const { data: userProfile } = await supabase
      .from('users')
      .select('user_tier')
      .eq('id', user.id)
      .single()

    const currentTier = (userProfile?.user_tier || 'free') as UserTier

    if (!stripeHelpers.isValidUpgrade(currentTier, tier as UserTier)) {
      return NextResponse.json(
        { error: 'Invalid upgrade path' },
        { status: 400 }
      )
    }

    // Debug logging
    console.log('Creating checkout session for:', {
      tier,
      userId: user.id,
      userEmail: user.email,
      currentTier
    })

    // Debug logging for checkout session creation
    console.log('Creating checkout session with valid payment methods')

    // Create checkout session
    const session = await stripeHelpers.createCheckoutSession(
      tier as UserTier,
      user.id,
      user.email!
    )

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })

  } catch (error: any) {
    console.error('=== CHECKOUT SESSION ERROR ===')
    console.error('Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error type:', error.type)
    console.error('Error code:', error.code)
    console.error('Request tier:', tier)
    console.error('User ID:', user?.id)
    console.error('User email:', user?.email)
    console.error('=== END ERROR DETAILS ===')
    
    // Also log what we were trying to do
    console.error('Attempted operation: Creating Stripe checkout session')
    console.error('Tier requested:', tier)
    console.error('Environment variables present:', {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasProPriceId: !!process.env.STRIPE_PRO_PRICE_ID,
      hasUltraPriceId: !!process.env.STRIPE_ULTRA_PRICE_ID,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message || 'Unknown error',
        type: error.type || 'unknown',
        code: error.code || 'unknown'
      },
      { status: 500 }
    )
  }
}