import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple admin health check...')
    
    // Simple health check without authentication
    return NextResponse.json({
      status: 'admin_health_ok',
      timestamp: new Date().toISOString(),
      message: 'Admin health endpoint working',
      environment: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasStripe: !!process.env.STRIPE_SECRET_KEY
    })

  } catch (error: any) {
    console.error('❌ Admin health check error:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}