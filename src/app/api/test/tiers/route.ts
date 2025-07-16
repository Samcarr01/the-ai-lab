import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('Testing tier columns...')
    
    // Test if required_tier column exists
    const { data: gpts, error: gptsError } = await supabase
      .from('gpts')
      .select('id, title, required_tier, tier')
      .limit(3)
    
    if (gptsError) {
      console.error('GPTs error:', gptsError)
      return NextResponse.json({ 
        error: 'GPTs query failed', 
        details: gptsError.message,
        code: gptsError.code 
      }, { status: 500 })
    }
    
    console.log('GPTs sample:', gpts)
    
    // Test documents too
    const { data: docs, error: docsError } = await supabase
      .from('documents')
      .select('id, title, required_tier, tier')
      .limit(3)
    
    if (docsError) {
      console.error('Docs error:', docsError)
      return NextResponse.json({ 
        error: 'Documents query failed', 
        details: docsError.message,
        code: docsError.code 
      }, { status: 500 })
    }
    
    console.log('Documents sample:', docs)
    
    // Test users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_tier, is_pro')
      .limit(3)
    
    if (usersError) {
      console.error('Users error:', usersError)
      return NextResponse.json({ 
        error: 'Users query failed', 
        details: usersError.message,
        code: usersError.code 
      }, { status: 500 })
    }
    
    console.log('Users sample:', users)
    
    return NextResponse.json({
      status: 'success',
      data: {
        gpts: gpts?.map(g => ({
          title: g.title,
          required_tier: g.required_tier || 'NOT SET',
          tier: g.tier || 'NOT SET'
        })) || [],
        documents: docs?.map(d => ({
          title: d.title,
          required_tier: d.required_tier || 'NOT SET',
          tier: d.tier || 'NOT SET'
        })) || [],
        users: users?.map(u => ({
          email: u.email,
          user_tier: u.user_tier || 'NOT SET',
          is_pro: u.is_pro
        })) || []
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}