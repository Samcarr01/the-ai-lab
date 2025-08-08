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

    const contentPrompt = `Based on this comprehensive research about ${toolDomain}:

${researchData}

Create an in-depth affiliate tool analysis with a compelling personal story. Write as a successful AI entrepreneur who has extensively tested this tool in real business scenarios.

REQUIREMENTS:

DESCRIPTION (250-350 words):
- Opening: Personal discovery story with context (when/why we found it)
- Immediate impact: First impression and early results
- Deep dive: Why we love it with 3-4 specific reasons and concrete examples
- Feature breakdown: Most impactful capabilities with real-world applications  
- Transformation metrics: Specific time saved, efficiency gained, or revenue impact
- Pain points solved: What frustrating problems it eliminates completely
- Daily workflow integration: How it fits seamlessly into operations
- Competitive advantage: What makes it superior to alternatives
- ROI evidence: Quantifiable benefits, productivity gains, or cost savings
- Personal testament: Why it's become indispensable
- Professional recommendation: Why serious professionals need this

ENHANCED SECTIONS:
- "why_we_love_it": 4-5 detailed reasons with specific examples
- "standout_features": 4-6 key features with practical applications
- "key_benefits": 4-6 benefits with quantifiable outcomes

STYLE GUIDELINES:
- Personal, authentic, and trustworthy tone
- Include specific metrics, percentages, time savings
- Focus on real business transformation and measurable value
- Genuine enthusiasm balanced with professional credibility
- Use concrete examples over generic statements

ENHANCED STRUCTURE EXAMPLE:
"When we discovered [Tool] six months ago during a particularly challenging project, it immediately caught our attention. The [specific capability] solved a problem we'd been wrestling with for months, and within the first week, we saw [specific improvement/metric].

What makes us evangelical about this tool? First, [detailed reason 1 with example]. Second, [detailed reason 2 with specific outcome]. Third, [detailed reason 3 with measurable benefit]. Finally, [detailed reason 4 with practical application].

The standout features that transformed our workflow include [feature 1 with real-world use case], [feature 2 with efficiency gain], [feature 3 with problem solved], and [feature 4 with competitive advantage]. Each of these directly addresses pain points we face daily.

Before [Tool], our process involved [old inefficient method] which took [time/cost]. Now, we can [new efficient process] in [reduced time], saving us approximately [specific metric] per [timeframe]. The ROI became evident within [specific timeframe] when we [specific achievement].

It's become so integral to our operations that we can't imagine working without it. The [specific feature] alone has transformed how we approach [specific task], while the [another feature] ensures we never miss [specific opportunity/problem]. For anyone serious about [field/industry], this tool isn't just recommended - it's absolutely essential for staying competitive."

Respond in JSON format:
{
  "title": "Professional Tool Name (exactly as the tool markets itself)",
  "description": "Detailed 250-350 word personal story with specific metrics and real-world applications",
  "category": "Most appropriate category from: Automation, Productivity, Development, Marketing, Design, Communication, Analysis, Research, Business Planning",
  "key_benefits": ["benefit1 with specific metric/outcome", "benefit2 with quantified improvement", "benefit3 with measurable value", "benefit4 with practical impact"],
  "why_we_love_it": ["detailed reason 1 with specific example", "detailed reason 2 with concrete outcome", "detailed reason 3 with practical benefit", "detailed reason 4 with real-world application"],
  "standout_features": ["feature1 with practical use case", "feature2 with efficiency benefit", "feature3 with problem-solving capability", "feature4 with competitive advantage"],
  "original_url": "Clean tool website URL (without affiliate tracking parameters)"
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
        max_tokens: 1200,
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
      why_we_love_it: analyzed.why_we_love_it || [],
      standout_features: analyzed.standout_features || [],
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
    
    // Enhanced fallback with comprehensive structure
    const fallbackResult = {
      title: 'Essential Business Tool',
      description: 'When we first discovered this tool during a busy quarter, it immediately stood out for its ability to streamline our most time-consuming processes. Within the first month of implementation, we noticed a 35% reduction in manual work and significantly improved team coordination. The intuitive design means zero learning curve, while the robust feature set handles everything from basic automation to complex workflow management. What really impressed us was how it integrated seamlessly with our existing tools, eliminating the usual friction of adopting new software. The time savings alone - approximately 8-10 hours per week across our team - justified the investment within the first billing cycle. Beyond efficiency, it solved our biggest pain point: maintaining consistency across projects. Now every team member follows the same optimized process, resulting in higher quality output and fewer errors. The real-time collaboration features have transformed how we approach deadlines, turning what used to be stressful rushes into smooth, coordinated efforts. For any serious business looking to scale operations without adding overhead, this tool has become absolutely indispensable to our success.',
      category: 'Productivity',
      key_benefits: [
        'Reduces manual work by 35% with intelligent automation',
        'Saves 8-10 hours per week across team operations', 
        'Eliminates process inconsistencies with standardized workflows',
        'Integrates seamlessly with existing business tools'
      ],
      why_we_love_it: [
        'Zero learning curve with intuitive design that gets teams productive immediately',
        'Robust automation handles complex workflows without breaking or requiring maintenance',
        'Real-time collaboration features eliminate coordination bottlenecks during crunch times',
        'Scalable architecture grows with business needs without performance degradation'
      ],
      standout_features: [
        'Intelligent workflow automation with customizable triggers and conditions',
        'Real-time team collaboration with instant updates and notifications',
        'Seamless integration hub connecting all essential business tools',
        'Advanced analytics dashboard providing actionable insights on team productivity'
      ],
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