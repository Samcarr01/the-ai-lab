import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Enhanced PDF text extraction function with multiple fallback methods
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Attempting to extract text from PDF:', file.name)
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Method 1: Try pdf-parse
    try {
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(buffer, {
        max: 5, // Only parse first 5 pages for speed
        version: 'v1.10.100'
      })
      
      let text = data.text || ''
      
      if (text && text.length > 50) {
        // Clean up the text
        text = text
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s.,!?;:()\-'"/\\]/g, '')
          .trim()
        
        console.log('pdf-parse succeeded, extracted text length:', text.length)
        return text.length > 100 ? text.substring(0, 4000) : text
      }
    } catch (pdfParseError) {
      console.log('pdf-parse failed:', pdfParseError instanceof Error ? pdfParseError.message : 'Unknown error')
    }
    
    // Method 2: Binary text extraction (looks for readable text in PDF structure)
    try {
      const text = buffer.toString('binary')
      
      // Look for text objects in PDF structure
      const textMatches = text.match(/\([^)]+\)/g) || [] // Text in parentheses
      const streamMatches = text.match(/stream[\s\S]*?endstream/g) || [] // Text streams
      
      let extractedText = ''
      
      // Extract text from parentheses (common PDF text storage)
      textMatches.forEach(match => {
        const cleanMatch = match.replace(/[()]/g, '').trim()
        if (cleanMatch.length > 3 && /^[A-Za-z0-9\s.,!?;:\-'"]+$/.test(cleanMatch)) {
          extractedText += cleanMatch + ' '
        }
      })
      
      // Also try to extract readable ASCII text
      const asciiMatches = text.match(/[A-Za-z][A-Za-z\s.,!?;:\-'"]{10,}/g) || []
      asciiMatches.forEach(match => {
        if (match.trim().length > 10) {
          extractedText += match.trim() + ' '
        }
      })
      
      extractedText = extractedText
        .replace(/\s+/g, ' ')
        .trim()
      
      if (extractedText.length > 100) {
        console.log('Binary extraction succeeded, length:', extractedText.length)
        return extractedText.substring(0, 3000)
      }
    } catch (binaryError) {
      console.log('Binary extraction failed:', binaryError instanceof Error ? binaryError.message : 'Unknown error')
    }
    
    // Method 3: UTF-8 text extraction (last resort)
    try {
      const text = buffer.toString('utf8')
      const textMatches = text.match(/[A-Za-z\s.,!?;:\-()]{15,}/g) || []
      const extractedText = textMatches
        .filter(match => match.trim().length > 15)
        .slice(0, 50)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      if (extractedText.length > 50) {
        console.log('UTF-8 extraction succeeded, length:', extractedText.length)
        return extractedText.substring(0, 2000)
      }
    } catch (utf8Error) {
      console.log('UTF-8 extraction failed:', utf8Error instanceof Error ? utf8Error.message : 'Unknown error')
    }
    
    console.log('All extraction methods failed')
    return ''
    
  } catch (error) {
    console.error('PDF text extraction completely failed:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  let file: File | null = null
  
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    file = formData.get('document') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Document file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    const fileName = file.name
    const fileSize = file.size

    // Extract text content from PDF
    let extractedText = ''
    try {
      extractedText = await extractTextFromPDF(file)
      console.log('PDF text extraction result:', extractedText.length > 0 ? 'Success' : 'Failed')
    } catch (extractError) {
      console.error('PDF extraction error:', extractError)
      extractedText = ''
    }

    // Create analysis prompt with actual content or filename fallback
    let analysisPrompt = ''
    
    if (extractedText && extractedText.length > 100) {
      analysisPrompt = `
You are analyzing a PDF document with the filename: "${fileName}"

Here is the extracted text content from the document:
"${extractedText}"

Based on the actual content and filename, provide:

1. A clean, professional title that accurately reflects the document's content
2. A compelling description (2-3 sentences) explaining what the document covers and its value
3. The most appropriate category from: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development

Focus on the actual content rather than just the filename.

Respond in JSON format:
{
  "title": "Accurate Title Based on Content",
  "description": "Compelling description based on actual document content and value.",
  "category": "Most Appropriate Category"
}
`
    } else {
      // Fallback to filename-based analysis with much better prompting
      console.log('Using filename-based analysis for:', fileName)
      const nameWithoutExt = fileName.replace('.pdf', '')
      const cleanName = nameWithoutExt.replace(/[-_]/g, ' ')
      
      analysisPrompt = `
You are analyzing a PDF document with the filename: "${fileName}"

Text extraction failed, so analyze based on the filename. The filename appears to be: "${cleanName}"

Based on the filename and common patterns, provide:

1. A clean, professional title that makes the filename more readable and professional
   - For "ai_developers_playbook" → "AI Developer's Playbook" 
   - For "vibe_coding_guide" → "Vibe Coding Guide"
   - For "automation_workflows" → "Automation Workflows Guide"

2. A compelling description (2-3 sentences) that explains what this type of document likely contains
   - Focus on practical value and actionable insights
   - Mention specific benefits for the target audience

3. The most appropriate category from: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development
   - "ai", "coding", "development" → Development
   - "business", "startup", "planning" → Business Planning  
   - "productivity", "workflow", "automation" → Productivity or Automation
   - "design", "ui", "ux" → Design

Respond in JSON format:
{
  "title": "Professional Title Based on Filename",
  "description": "Compelling description explaining likely content and practical value.",
  "category": "Most Appropriate Category"
}
`
    }

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
            content: 'You are an expert at analyzing and categorizing business documents and guides. Create professional titles and compelling descriptions.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    console.log('Making OpenAI API request...')
    
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API request failed:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API request failed: ${openaiResponse.status}`)
    }

    const aiResult = await openaiResponse.json()
    console.log('OpenAI response received:', aiResult)
    
    const content = aiResult.choices[0]?.message?.content

    if (!content) {
      console.error('No content received from OpenAI')
      throw new Error('No content received from OpenAI')
    }

    console.log('Raw AI content:', content)

    // Parse the JSON response
    let analyzed
    try {
      analyzed = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('Raw content was:', content)
      throw new Error('Failed to parse AI response')
    }

    console.log('Parsed analysis result:', analyzed)

    const result = {
      title: analyzed.title || fileName.replace('.pdf', '').replace(/[-_]/g, ' '),
      description: analyzed.description || 'Comprehensive guide with actionable insights and proven strategies.',
      category: analyzed.category || 'Business Planning'
    }

    console.log('Returning analysis result:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Document analysis error:', error)
    
    // Enhanced fallback response based on filename
    const nameWithoutExt = file?.name?.replace('.pdf', '') || 'Document'
    const cleanName = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    
    const fallbackResult = {
      title: cleanName || 'Business Guide',
      description: 'Comprehensive PDF guide with valuable insights and actionable strategies for success.',
      category: 'Business Planning'
    }

    console.log('Returning fallback result:', fallbackResult)
    return NextResponse.json(fallbackResult)
  }
}