import { NextRequest, NextResponse } from 'next/server'
import { getStripe, stripeHelpers } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { UserTier } from '@/lib/user'

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json()

    if (!tier || !['pro', 'ultra'].includes(tier)) {
      return NextResponse.json(
        { error: 'Valid tier (pro or ultra) is required' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

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
    console.error('Checkout session creation failed:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Request tier:', tier)
    console.error('User ID:', user?.id)
    console.error('User email:', user?.email)
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}