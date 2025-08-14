import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Server-side profile API that uses service role for performance
// This bypasses RLS sequential scans while maintaining security
export async function GET(request: NextRequest) {
  try {
    // Get user ID from URL params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Verify user is authenticated by checking their session
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${cookieStore.get('sb-access-token')?.value || ''}`
        }
      }
    })
    
    // Verify the requesting user matches the profile being requested
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - can only access own profile' },
        { status: 401 }
      )
    }
    
    // Use service role client for fast profile lookup without RLS overhead
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      console.error('🚨 Server: Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const serviceClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('🔍 Server: Fetching profile for userId:', userId)
    
    // Fast profile query using service role (bypasses RLS sequential scan)
    const { data: profileData, error: profileError } = await serviceClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.error('❌ Server: Error querying profile:', profileError)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Server: Profile found successfully')
    
    // Apply admin tier logic if needed
    let profile = profileData
    if (profileData.email === 'samcarr1232@gmail.com' && !profileData.user_tier) {
      profile = {
        ...profileData,
        is_pro: true,
        user_tier: 'ultra'
      }
    } else {
      profile = {
        ...profileData,
        is_pro: profileData.user_tier === 'pro' || profileData.user_tier === 'ultra'
      }
    }
    
    return NextResponse.json({ profile })
    
  } catch (error: any) {
    console.error('❌ Server: Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}