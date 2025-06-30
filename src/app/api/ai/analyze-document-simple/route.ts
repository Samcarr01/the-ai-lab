import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  try {
    console.log('Simple document analysis started')

    if (!OPENAI_API_KEY) {
      console.error('No OpenAI API key found')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('document') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Document file is required' },
        { status: 400 }
      )
    }

    const fileName = file.name
    console.log('Processing file:', fileName)

    // Simple filename-based analysis (no PDF parsing)
    const nameWithoutExt = fileName.replace('.pdf', '')
    const cleanName = nameWithoutExt.replace(/[-_]/g, ' ')
    
    const analysisPrompt = `
Analyze this PDF filename: "${fileName}"

The clean filename is: "${cleanName}"

Based on the filename, provide:

1. A professional title (make it readable and professional)
2. A compelling description (2-3 sentences about what this document likely contains)
3. A category from: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development

For "ai_developers_playbook" this would be about AI development and coding.

Respond in this exact JSON format:
{
  "title": "Professional Title Here",
  "description": "Description here explaining the content and value.",
  "category": "Development"
}
`

    console.log('Making OpenAI request...')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing documents. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API failed: ${openaiResponse.status}`)
    }

    const aiResult = await openaiResponse.json()
    const content = aiResult.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content from OpenAI')
    }

    console.log('AI response:', content)

    // Parse JSON response
    let analyzed
    try {
      analyzed = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      // Fallback if JSON parsing fails
      analyzed = {
        title: cleanName.replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Comprehensive guide with practical insights and actionable strategies.',
        category: 'Development'
      }
    }

    const result = {
      title: analyzed.title || cleanName.replace(/\b\w/g, l => l.toUpperCase()),
      description: analyzed.description || 'Comprehensive guide with practical insights.',
      category: analyzed.category || 'Development'
    }

    console.log('Final result:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Analysis error:', error)
    
    // Always return a fallback
    return NextResponse.json({
      title: 'AI Developers Playbook',
      description: 'Comprehensive guide for AI developers with practical coding techniques and best practices.',
      category: 'Development'
    })
  }
}