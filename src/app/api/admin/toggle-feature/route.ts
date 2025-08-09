import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // CRITICAL SECURITY: Verify admin authentication
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user || user.email !== 'samcarr1232@gmail.com') {
      console.error('❌ Admin access denied:', { 
        hasUser: !!user, 
        email: user?.email, 
        requiredEmail: 'samcarr1232@gmail.com' 
      })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('✅ Admin access verified for:', user.email)
    
    const { type, id, is_featured } = await request.json()
    
    if (!type || !id || typeof is_featured !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (type !== 'gpt' && type !== 'document') {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    
    const table = type === 'gpt' ? 'gpts' : 'documents'
    
    const { error } = await supabaseAdmin
      .from(table)
      .update({ is_featured })
      .eq('id', id)
    
    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json({ error: 'Failed to update', details: error }, { status: 500 })
    }
    
    // Verify the update
    const { data: updated, error: verifyError } = await supabaseAdmin
      .from(table)
      .select('id, title, is_featured')
      .eq('id', id)
      .single()
    
    if (verifyError) {
      console.error('Verification error:', verifyError)
      return NextResponse.json({ error: 'Failed to verify update', details: verifyError }, { status: 500 })
    }
    
    console.log(`✅ Feature toggle success: ${updated.title} is_featured = ${updated.is_featured}`)
    
    return NextResponse.json({
      success: true,
      updated,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}