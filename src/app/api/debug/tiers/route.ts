import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get all GPTs with their tier assignments - handle missing columns gracefully
    const { data: gpts, error: gptsError } = await supabase
      .from('gpts')
      .select('title, required_tier, is_featured')
      .order('title')
    
    if (gptsError) {
      console.error('Error fetching GPTs:', gptsError)
      // Return empty data instead of failing
      return NextResponse.json({
        message: 'Debug API - database schema issues',
        error: gptsError.message,
        gpts: [],
        documents: [],
        summary: { gpts: { total: 0, counts: {} }, documents: { total: 0, counts: {} } }
      })
    }
    
    // Get all documents with their tier assignments
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('title, required_tier, is_featured')
      .order('title')
    
    if (docsError) {
      console.error('Error fetching documents:', docsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }
    
    // Calculate tier counts
    const gptTierCounts = {
      free: gpts.filter(g => g.required_tier === 'free').length,
      pro: gpts.filter(g => g.required_tier === 'pro').length,
      ultra: gpts.filter(g => g.required_tier === 'ultra').length,
      unset: gpts.filter(g => !g.required_tier).length
    }
    
    const docTierCounts = {
      free: documents.filter(d => d.required_tier === 'free').length,
      pro: documents.filter(d => d.required_tier === 'pro').length,
      ultra: documents.filter(d => d.required_tier === 'ultra').length,
      unset: documents.filter(d => !d.required_tier).length
    }
    
    return NextResponse.json({
      message: 'Current tier assignments',
      gpts: gpts.map(gpt => ({
        title: gpt.title,
        required_tier: gpt.required_tier || 'NOT SET',
        is_featured: gpt.is_featured
      })),
      documents: documents.map(doc => ({
        title: doc.title,
        required_tier: doc.required_tier || 'NOT SET',
        is_featured: doc.is_featured
      })),
      summary: {
        gpts: {
          total: gpts.length,
          counts: gptTierCounts
        },
        documents: {
          total: documents.length,
          counts: docTierCounts
        }
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}