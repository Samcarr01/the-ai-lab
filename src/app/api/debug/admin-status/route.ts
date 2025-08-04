import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gptsService } from '@/lib/gpts'
import { documentsService } from '@/lib/documents'
import { blogService } from '@/lib/blog'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking admin page status...')
    
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const authStatus = {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      isAdmin: user?.email === 'samcarr1232@gmail.com',
      authError: authError?.message
    }

    console.log('👤 Auth status:', authStatus)

    // Check content loading
    let contentStatus = {
      gpts: { count: 0, error: null },
      documents: { count: 0, error: null },
      blogPosts: { count: 0, error: null }
    }

    try {
      const gpts = await gptsService.getAllGPTs()
      contentStatus.gpts = { count: gpts.length, error: null }
      console.log(`📋 GPTs loaded: ${gpts.length}`)
    } catch (gptError: any) {
      contentStatus.gpts = { count: 0, error: gptError.message }
      console.error('❌ GPTs loading failed:', gptError)
    }

    try {
      const documents = await documentsService.getAllDocuments()
      contentStatus.documents = { count: documents.length, error: null }
      console.log(`📄 Documents loaded: ${documents.length}`)
    } catch (docError: any) {
      contentStatus.documents = { count: 0, error: docError.message }
      console.error('❌ Documents loading failed:', docError)
    }

    try {
      const blogPosts = await blogService.getAllPosts()
      contentStatus.blogPosts = { count: blogPosts.length, error: null }
      console.log(`📝 Blog posts loaded: ${blogPosts.length}`)
    } catch (blogError: any) {
      contentStatus.blogPosts = { count: 0, error: blogError.message }
      console.error('❌ Blog posts loading failed:', blogError)
    }

    // Check database connectivity
    let dbStatus = 'unknown'
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      dbStatus = testError ? `error: ${testError.message}` : 'connected'
    } catch (dbError: any) {
      dbStatus = `error: ${dbError.message}`
    }

    return NextResponse.json({
      status: 'admin_status_check_complete',
      timestamp: new Date().toISOString(),
      authentication: authStatus,
      content: contentStatus,
      database: dbStatus,
      recommendations: [
        !authStatus.hasUser ? 'User not authenticated - check login' : null,
        !authStatus.isAdmin ? 'User is not admin - check email' : null,
        contentStatus.gpts.error ? 'GPTs loading failed - check database connection' : null,
        contentStatus.documents.error ? 'Documents loading failed - check database connection' : null,
        contentStatus.blogPosts.error ? 'Blog posts loading failed - check database connection' : null,
        dbStatus.includes('error') ? 'Database connection issues detected' : null
      ].filter(Boolean)
    })

  } catch (error: any) {
    console.error('❌ Admin status check error:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}