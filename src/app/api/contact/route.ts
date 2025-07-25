import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient()

    // Store contact form submission in database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim(),
          submitted_at: new Date().toISOString(),
          status: 'new'
        }
      ])
      .select()

    if (error) {
      console.error('Database error:', error)
      
      // If table doesn't exist, that's expected - we'll just log the submission
      if (error.code === '42P01') {
        console.log('Contact form submission (table not created yet):', {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim()
        })
        
        return NextResponse.json({ 
          success: true, 
          message: 'Thank you for your message! We\'ll get back to you soon.' 
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to submit contact form' },
        { status: 500 }
      )
    }

    // Log successful submission
    console.log('Contact form submission received:', {
      id: data[0]?.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for your message! We\'ll get back to you soon.' 
    })

  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}