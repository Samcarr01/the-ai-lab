import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { userService } from '@/lib/user'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Auth Status Debug: Starting auth status check...')
    
    // Get user from auth
    const { user: authUser, error: authError } = await auth.getUser()
    console.log('📋 Auth Status Debug: Auth user result:', { 
      hasUser: !!authUser, 
      userId: authUser?.id,
      email: authUser?.email,
      error: authError?.message 
    })
    
    let userProfile = null
    let profileError = null
    
    if (authUser) {
      try {
        userProfile = await userService.getProfile(authUser.id)
        console.log('📋 Auth Status Debug: Profile result:', { hasProfile: !!userProfile })
      } catch (error: any) {
        profileError = error.message
        console.error('❌ Auth Status Debug: Profile error:', error)
      }
    }
    
    const response = {
      timestamp: new Date().toISOString(),
      auth: {
        hasUser: !!authUser,
        userId: authUser?.id || null,
        email: authUser?.email || null,
        userMetadata: authUser?.user_metadata || null,
        error: authError?.message || null
      },
      profile: {
        hasProfile: !!userProfile,
        profileId: userProfile?.id || null,
        profileEmail: userProfile?.email || null,
        userTier: userProfile?.user_tier || null,
        firstName: userProfile?.first_name || null,
        lastName: userProfile?.last_name || null,
        error: profileError
      },
      session: {
        hasSession: !!authUser
      }
    }
    
    console.log('✅ Auth Status Debug: Complete status:', response)
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('❌ Auth Status Debug: Fatal error:', error)
    return NextResponse.json({
      error: 'Auth status check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}