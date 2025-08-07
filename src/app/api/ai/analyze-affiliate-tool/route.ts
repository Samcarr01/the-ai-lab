import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

export async function POST(request: NextRequest) {
  let affiliateUrl: string = ''
  
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      )
    }

    const requestData = await request.json()
    affiliateUrl = requestData.url

    if (!affiliateUrl) {
      return NextResponse.json(
        { error: 'Affiliate URL is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Analyzing affiliate tool:', affiliateUrl)

    // Extract the original tool domain from affiliate URL
    let toolDomain = ''
    try {
      const url = new URL(affiliateUrl)
      toolDomain = url.hostname.replace('www.', '')
    } catch {
      // If affiliate URL parsing fails, try to extract domain from the URL
      const domainMatch = affiliateUrl.match(/(?:https?:\/\/)?(?:www\.)?([^\/\?\#]+)/i)
      toolDomain = domainMatch ? domainMatch[1] : 'the tool'
    }

    // Step 1: Research with Perplexity
    console.log('📚 Starting Perplexity research for:', toolDomain)
    
    const researchPrompt = `Research ${toolDomain} and provide comprehensive information about:

1. What the tool does and its main purpose
2. Key features and capabilities
3. Pricing model and value proposition
4. Target audience and use cases
5. What makes it unique compared to competitors
6. User reviews and testimonials
7. Integration capabilities
8. Any notable statistics or achievements

Focus on factual, current information that would help someone understand why this tool is valuable.`

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant focused on providing comprehensive, factual information about software tools and platforms. Provide detailed, accurate research.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text()
      console.error('❌ Perplexity API error:', perplexityResponse.status, errorText)
      throw new Error(`Perplexity research failed: ${perplexityResponse.status}`)
    }

    const perplexityResult = await perplexityResponse.json()
    const researchData = perplexityResult.choices[0]?.message?.content

    if (!researchData) {
      throw new Error('No research data received from Perplexity')
    }

    console.log('✅ Perplexity research completed:', researchData.length, 'characters')

    // Step 2: Generate compelling content with OpenAI
    console.log('✍️ Generating content with OpenAI...')

    const contentPrompt = `Based on this research about ${toolDomain}:

${researchData}

Create an engaging affiliate tool description that follows these requirements:

STYLE & TONE:
- Write as a successful AI entrepreneur personally recommending this tool
- Conversational and enthusiastic but trustworthy
- Focus on transformation and real value
- Include a compelling statistic or specific benefit

STRUCTURE (150-200 words max):
1. Opening hook - Why this tool caught our attention
2. Key transformation/benefit - What problem it solves
3. Specific value - Include a number, statistic, or concrete benefit
4. Personal touch - Why it's in "our toolkit"
5. Enthusiasm closer - Why it's essential

AVOID:
- Generic descriptions
- Overly promotional language
- Feature lists without benefits
- Being too lengthy

EXAMPLE TONE:
"When we discovered [Tool], it completely changed how we [specific use case]. The ability to [key feature] meant we could [specific benefit/time saved]. What really impressed us was [compelling fact/statistic]. It's become an essential part of our daily workflow because [personal reason]. For anyone serious about [relevant field], this tool is non-negotiable."

Respond in JSON format:
{
  "title": "Professional Tool Name",
  "description": "Engaging 150-200 word personal recommendation",
  "category": "Most appropriate category from: Automation, Productivity, Development, Marketing, Design, Communication, Analysis, Research",
  "key_benefits": ["benefit1", "benefit2", "benefit3"],
  "original_url": "Clean tool website URL (without affiliate params)"
}`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing compelling, personal product recommendations for successful entrepreneurs. Your writing converts because it focuses on real transformation and value.'
          },
          {
            role: 'user',
            content: contentPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI content generation failed: ${openaiResponse.status}`)
    }

    const aiResult = await openaiResponse.json()
    const content = aiResult.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from OpenAI')
    }

    // Parse the JSON response
    let analyzed
    try {
      analyzed = JSON.parse(content)
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError)
      console.error('Raw content:', content)
      throw new Error('Failed to parse AI response')
    }

    const result = {
      title: analyzed.title || `${toolDomain} Tool`,
      description: analyzed.description || 'An amazing tool that transforms workflows and boosts productivity.',
      category: analyzed.category || 'Productivity',
      key_benefits: analyzed.key_benefits || [],
      original_url: analyzed.original_url || `https://${toolDomain}`,
      research_data: {
        perplexity_research: researchData,
        generated_at: new Date().toISOString(),
        source_url: affiliateUrl
      }
    }

    console.log('✅ Affiliate tool analysis completed:', result.title)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Affiliate tool analysis error:', error)
    
    // Enhanced fallback based on URL
    const fallbackResult = {
      title: 'Affiliate Tool',
      description: 'This tool has become an essential part of our workflow. It streamlines processes, saves time, and delivers consistent results that have transformed how we operate. The intuitive interface and powerful features make it perfect for teams looking to optimize their productivity and achieve better outcomes.',
      category: 'Productivity',
      key_benefits: ['Streamlines workflows', 'Saves time', 'Improves productivity'],
      original_url: affiliateUrl,
      research_data: {
        error: error instanceof Error ? error.message : 'Unknown error',
        generated_at: new Date().toISOString(),
        source_url: affiliateUrl
      }
    }

    console.log('⚠️ Returning fallback result due to error')
    return NextResponse.json(fallbackResult)
  }
}