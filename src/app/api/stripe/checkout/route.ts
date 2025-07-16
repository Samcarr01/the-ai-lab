import { NextRequest, NextResponse } from 'next/server'
import { stripeHelpers } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { userService, type UserTier } from '@/lib/user'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const { tier, userId, userEmail } = await request.json()

    // Validate tier
    if (!tier || !['pro', 'ultra'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier specified' },
        { status: 400 }
      )
    }

    // Validate user data
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 400 }
      )
    }

    // Get user profile from Supabase
    const userProfile = await userService.getProfile(user.id)
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentTier = userProfile.user_tier || 'free'

    // Check if this is a valid upgrade
    if (!stripeHelpers.isValidUpgrade(currentTier, tier)) {
      return NextResponse.json(
        { error: `Cannot upgrade from ${currentTier} to ${tier}` },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const session = await stripeHelpers.createCheckoutSession(
      tier as UserTier,
      user.id,
      userEmail || user.email!
    )

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}