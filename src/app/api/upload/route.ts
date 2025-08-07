import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
    const fileName = `affiliate-tool-${timestamp}-${originalName}`

    // Upload to Supabase Storage
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('blog-images') // Use existing blog-images bucket
      .upload(`affiliate-tools/${fileName}`, file, {
        cacheControl: '31536000', // Cache for 1 year
        upsert: true
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Upload failed' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(`affiliate-tools/${fileName}`)

    console.log('✅ Image uploaded successfully:', publicUrlData.publicUrl)

    return NextResponse.json({ 
      url: publicUrlData.publicUrl,
      fileName: fileName,
      size: file.size
    })

  } catch (error) {
    console.error('Upload route error:', error)
    return NextResponse.json(
      { error: 'Server error during upload' },
      { status: 500 }
    )
  }
}