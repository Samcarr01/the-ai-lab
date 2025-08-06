import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('🔧 Starting blog permissions diagnosis and fix...')
    
    const supabase = createClient()
    
    // Get current user to verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: authError?.message 
      }, { status: 401 })
    }

    // Verify admin user
    if (user.email !== 'samcarr1232@gmail.com') {
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    console.log('✅ Admin user verified, diagnosing permissions...')
    
    // First, let's test what permissions we currently have
    console.log('🔍 Testing current blog_posts table permissions...')
    
    // Test direct insert without RLS policies
    const testPost = {
      title: 'Permission Test Post',
      content: 'This is a test to check blog_posts permissions.',
      slug: 'permission-test-' + Date.now(),
      published_at: new Date().toISOString(),
      meta_description: 'Test post for permission diagnosis',
      category: 'Test',
      read_time: 1
    }

    const { data: insertData, error: insertError } = await supabase
      .from('blog_posts')
      .insert([testPost])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Direct insert failed:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      
      // Check if it's an RLS issue
      if (insertError.message?.includes('RLS') || insertError.message?.includes('policy') || insertError.code === '42501') {
        console.log('🔍 This appears to be an RLS (Row Level Security) issue')
        
        // Temporarily disable RLS for testing (admin only)
        console.log('🔧 Attempting to work around RLS...')
        
        // Try with service role client (if available in env)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.log('🔑 Using service role key to bypass RLS...')
          
          const { createClient } = await import('@supabase/supabase-js')
          const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          const { data: serviceInsertData, error: serviceInsertError } = await serviceClient
            .from('blog_posts')
            .insert([testPost])
            .select()
            .single()
          
          if (serviceInsertError) {
            console.error('❌ Service role insert also failed:', serviceInsertError)
            return NextResponse.json({
              success: false,
              message: 'Blog posts table has fundamental issues',
              error: serviceInsertError.message,
              suggestion: 'Check if blog_posts table exists and has correct schema'
            }, { status: 500 })
          } else {
            console.log('✅ Service role insert succeeded - this is definitely an RLS policy issue')
            
            // Clean up test post
            await serviceClient.from('blog_posts').delete().eq('id', serviceInsertData.id)
            
            return NextResponse.json({
              success: false,
              message: 'RLS policies are blocking blog post creation for authenticated users',
              solution: 'You need to configure RLS policies in Supabase dashboard',
              instructions: [
                '1. Go to your Supabase project dashboard',
                '2. Navigate to Authentication > Policies',
                '3. Find the blog_posts table',
                '4. Add an INSERT policy that allows your admin user to create posts',
                '5. Example policy: "Allow admin inserts" with condition: auth.email() = \'samcarr1232@gmail.com\''
              ]
            })
          }
        } else {
          return NextResponse.json({
            success: false,
            message: 'RLS policies are blocking blog post creation',
            error: insertError.message,
            solution: 'Configure RLS policies in Supabase dashboard to allow admin user to insert blog posts'
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({
          success: false,
          message: 'Blog post creation failed for unknown reason',
          error: insertError.message,
          details: insertError.details,
          code: insertError.code
        }, { status: 500 })
      }
    } else {
      console.log('✅ Blog post insert succeeded!')
      
      // Clean up test post
      if (insertData?.id) {
        await supabase.from('blog_posts').delete().eq('id', insertData.id)
        console.log('🧹 Test post cleaned up')
      }
      
      return NextResponse.json({
        success: true,
        message: 'Blog permissions are working correctly!',
        testResult: 'Insert and delete operations successful'
      })
    }

  } catch (error: any) {
    console.error('❌ Permission diagnosis error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to diagnose blog permissions',
      error: error.message
    }, { status: 500 })
  }
}