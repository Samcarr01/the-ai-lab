import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Setting up blog images storage...')
    
    const supabase = createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.email !== 'samcarr1232@gmail.com') {
      console.error('❌ Unauthorized storage setup attempt:', user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin user verified, setting up storage...')

    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Failed to list buckets:', listError)
      return NextResponse.json({ error: 'Failed to check existing buckets' }, { status: 500 })
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.id === 'blog-images')
    
    if (bucketExists) {
      console.log('✅ blog-images bucket already exists')
      return NextResponse.json({
        status: 'success',
        message: 'Blog images storage already configured',
        bucket: 'blog-images'
      })
    }

    // Create the bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('blog-images', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    })

    if (bucketError) {
      console.error('Failed to create bucket:', bucketError)
      return NextResponse.json({ 
        error: 'Failed to create storage bucket',
        details: bucketError.message 
      }, { status: 500 })
    }

    console.log('✅ Blog images storage bucket created successfully')

    return NextResponse.json({
      status: 'success',
      message: 'Blog images storage setup complete',
      bucket: bucketData?.name || 'blog-images'
    })

  } catch (error: any) {
    console.error('❌ Storage setup error:', error)
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST to this endpoint to set up blog images storage',
    note: 'Only admin user (samcarr1232@gmail.com) can run this setup',
    description: 'Creates blog-images bucket with public read access for storing DALL-E generated images permanently'
  })
}