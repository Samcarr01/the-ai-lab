import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client that bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // CRITICAL SECURITY: Verify admin authentication
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user || user.email !== 'samcarr1232@gmail.com') {
      console.error('❌ Admin content access denied:', { 
        hasUser: !!user, 
        email: user?.email, 
        requiredEmail: 'samcarr1232@gmail.com' 
      })
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    console.log('✅ Admin content access verified for:', user.email)
    // Get both GPTs and documents using admin client to bypass RLS
    const [gptsResult, documentsResult] = await Promise.all([
      supabaseAdmin
        .from('gpts')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('added_date', { ascending: false }),
      supabaseAdmin
        .from('documents') 
        .select('*')
        .order('is_featured', { ascending: false })
        .order('added_date', { ascending: false })
    ])

    if (gptsResult.error) {
      console.error('GPTs fetch error:', gptsResult.error)
      return NextResponse.json({ error: 'Failed to fetch GPTs', details: gptsResult.error }, { status: 500 })
    }

    if (documentsResult.error) {
      console.error('Documents fetch error:', documentsResult.error)
      return NextResponse.json({ error: 'Failed to fetch documents', details: documentsResult.error }, { status: 500 })
    }

    // Combine and sort all content
    const allContent = [
      ...(gptsResult.data || []).map(gpt => ({ ...gpt, type: 'gpt', created_at: gpt.added_date })),
      ...(documentsResult.data || []).map(doc => ({ ...doc, type: 'document', created_at: doc.added_date }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`✅ Admin content fetch: ${allContent.length} items (${gptsResult.data?.length || 0} GPTs, ${documentsResult.data?.length || 0} documents)`)

    return NextResponse.json({
      success: true,
      content: allContent,
      counts: {
        total: allContent.length,
        gpts: gptsResult.data?.length || 0,
        documents: documentsResult.data?.length || 0
      }
    })
  } catch (error) {
    console.error('Admin content API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}