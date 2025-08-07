import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(request: NextRequest) {
  let url: string = ''
  
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const requestData = await request.json()
    url = requestData.url

    if (!url) {
      return NextResponse.json(
        { error: 'GPT URL is required' },
        { status: 400 }
      )
    }

    // Fetch the GPT page to get actual title and description
    let gptData: any = {}
    try {
      console.log('🔍 Fetching GPT page:', url)
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (pageResponse.ok) {
        const html = await pageResponse.text()
        console.log('📄 Fetched HTML length:', html.length)
        
        // Extract title from multiple possible locations
        const titlePatterns = [
          /<title[^>]*>([^<]+)<\/title>/i,
          /<h1[^>]*>([^<]+)<\/h1>/i,
          /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
          /<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["'][^>]*>/i
        ]
        
        for (const pattern of titlePatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            gptData.title = match[1]
              .replace(' | ChatGPT', '')
              .replace(' - ChatGPT', '')
              .replace('ChatGPT - ', '')
              .trim()
            console.log('✅ Found title:', gptData.title)
            break
          }
        }

        // Extract description from multiple possible locations
        const descPatterns = [
          /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
          /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
          /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
          /<p[^>]*class=["'][^"']*description[^"']*["'][^>]*>([^<]+)<\/p>/i,
          /<div[^>]*class=["'][^"']*description[^"']*["'][^>]*>([^<]+)<\/div>/i
        ]
        
        for (const pattern of descPatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            gptData.description = match[1].trim()
            console.log('✅ Found description:', gptData.description.substring(0, 100) + '...')
            break
          }
        }

        // Try to extract GPT name from URL if title extraction failed
        if (!gptData.title) {
          const urlMatch = url.match(/\/g\/g-[a-f0-9]+-(.+)$/i)
          if (urlMatch && urlMatch[1]) {
            gptData.title = urlMatch[1]
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())
            console.log('✅ Extracted title from URL:', gptData.title)
          }
        }
        
        console.log('📊 Final extracted data:', gptData)
      } else {
        console.log('❌ Failed to fetch page:', pageResponse.status, pageResponse.statusText)
      }
    } catch (fetchError) {
      console.error('❌ Error fetching GPT page:', fetchError)
    }

    // Use OpenAI to analyze and enhance the content
    const analysisPrompt = `
You are analyzing a ChatGPT GPT from this URL: ${url}

${gptData.title ? `Extracted title: ${gptData.title}` : ''}
${gptData.description ? `Extracted description: ${gptData.description}` : ''}

Based on the URL and any extracted information, provide:

1. A clean, professional title that clearly conveys what the GPT does
   - Remove excessive emojis (keep 1-2 if relevant)
   - Make it descriptive and searchable
   - Focus on function over flashy language

2. A compelling description (2-3 sentences) that explains:
   - What specific problem this GPT solves
   - Key benefits and use cases
   - Who would find it most valuable

3. The most appropriate category from: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development, Education, Writing, Analysis, Research, Customer Service

Analyze the URL path and any extracted content to understand the GPT's actual purpose and functionality.

Respond in JSON format:
{
  "title": "Clear Descriptive Title",
  "description": "Specific description explaining the GPT's purpose, benefits, and ideal use cases.",
  "category": "Most Appropriate Category"
}
`

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
            content: `You are an expert at analyzing and categorizing AI tools. Provide clean, professional titles and compelling descriptions for GPTs.

CATEGORY GUIDELINES:
- Business Planning: Strategy, planning, market analysis, business models
- Productivity: Task management, workflows, optimization, efficiency
- Communication: Email writing, messaging, social media, presentations  
- Automation: Process automation, workflow automation, task automation
- Marketing: Content marketing, advertising, campaigns, growth strategies
- Design: UI/UX design, graphics, visual content, creative work
- Development: Coding, programming, software development, technical tasks
- Education: Learning, teaching, training, educational content
- Writing: Content creation, copywriting, editing, creative writing
- Analysis: Data analysis, research analysis, report generation
- Research: Information gathering, fact-checking, competitive research
- Customer Service: Support, help desk, customer communication

Choose the most specific category that accurately represents the GPT's primary function.`
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API request failed: ${openaiResponse.status} - ${errorText}`)
    }

    const aiResult = await openaiResponse.json()
    const content = aiResult.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Clean the content - remove markdown code blocks if present
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the JSON response
    const analyzed = JSON.parse(cleanContent)

    return NextResponse.json({
      title: analyzed.title || gptData.title || 'GPT Analysis',
      description: analyzed.description || gptData.description || 'AI-powered GPT tool',
      category: analyzed.category || 'Productivity'
    })

  } catch (error) {
    console.error('❌ GPT analysis error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: url
    })
    
    // Try to extract a better title from URL as fallback
    let fallbackTitle = 'GPT Tool'
    try {
      const urlMatch = url.match(/\/g\/g-[a-f0-9]+-(.+)$/i)
      if (urlMatch && urlMatch[1]) {
        fallbackTitle = urlMatch[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
      }
    } catch (urlError) {
      console.error('Error extracting title from URL:', urlError)
    }
    
    // Enhanced fallback response if AI analysis fails
    return NextResponse.json({
      title: fallbackTitle,
      description: 'AI-powered GPT tool for enhanced productivity and automation. Visit the ChatGPT link to learn more about its specific capabilities.',
      category: 'Productivity'
    })
  }
}