import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { imageStorageService } from '@/lib/image-storage'

// Configure for Node.js runtime with extended timeout
export const maxDuration = 60 // 60 seconds max for Vercel Hobby plan

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

// Security and cost limits
const MAX_PROMPT_LENGTH = 500
const MAX_KNOWLEDGE_BASE_LENGTH = 3000
const MAX_TOKENS = 4000 // Increased for longer content
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface ProgressStep {
  step: string
  status: 'starting' | 'running' | 'completed' | 'error'
  duration?: number
  message?: string
}

// Input validation and sanitization
function validateAndSanitizeInput(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') return ''
  
  // Remove potentially dangerous characters and limit length
  const sanitized = input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML-like characters
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    
  return sanitized
}

// Rate limiting check
function checkRateLimit(userEmail: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userEmail)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(userEmail, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  userLimit.count++
  return true
}

// Estimate token count (rough approximation)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4) // Rough estimate: 1 token ≈ 4 characters
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { prompt, knowledgeBase, includeWebSearch = true, includeImages = true } = body
    const searchProvider = 'perplexity' // Only Perplexity supported now
    
    // Validate and sanitize inputs
    prompt = validateAndSanitizeInput(prompt, MAX_PROMPT_LENGTH)
    knowledgeBase = validateAndSanitizeInput(knowledgeBase, MAX_KNOWLEDGE_BASE_LENGTH)
    
    if (!prompt || prompt.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Prompt must be at least 10 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Set up Server-Sent Events
    const encoder = new TextEncoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: ProgressStep) => {
          const formattedData = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(formattedData))
        }

        const startTime = Date.now()
        
        try {
          // Check authentication first
          const supabase = createClient()
          const { data: { user }, error: authError } = await supabase.auth.getUser()
          
          if (authError || !user) {
            sendProgress({
              step: 'setup',
              status: 'error',
              message: 'Authentication required. Please sign in again.'
            })
            controller.close()
            return
          }

          // Check if user is admin
          if (user.email !== 'samcarr1232@gmail.com') {
            sendProgress({
              step: 'setup',
              status: 'error',
              message: 'Admin access required for blog generation.'
            })
            controller.close()
            return
          }

          // Rate limiting check
          if (!checkRateLimit(user.email)) {
            sendProgress({
              step: 'setup',
              status: 'error',
              message: `Rate limit exceeded. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute.`
            })
            controller.close()
            return
          }

          if (!OPENAI_API_KEY) {
            sendProgress({
              step: 'setup',
              status: 'error',
              message: 'OpenAI API key not configured'
            })
            controller.close()
            return
          }

          if (searchProvider === 'perplexity' && includeWebSearch && !PERPLEXITY_API_KEY) {
            sendProgress({
              step: 'setup',
              status: 'error',
              message: 'Perplexity API key not configured. Please add PERPLEXITY_API_KEY to environment variables.'
            })
            controller.close()
            return
          }

          if (!prompt) {
            sendProgress({
              step: 'setup',
              status: 'error',
              message: 'Prompt is required'
            })
            controller.close()
            return
          }

          // Step 1: Setup and Knowledge Base Loading
          sendProgress({ step: 'setup', status: 'starting' })
          const setupStart = Date.now()

          // Load SEO knowledge - use custom knowledge base if provided
          const seoKnowledge = knowledgeBase || `
## Blog Structure & Length
- Optimal length: 1,500-2,500 words for best SEO performance
- Headline: 60-70 characters, include primary keyword near beginning
- Introduction: Hook reader in first 10-15 seconds, clear value proposition
- Body: Use H2/H3 headings hierarchically, 2-4 sentence paragraphs
- Conclusion: Summarize key takeaways, include clear call-to-action

## Content Quality Requirements
- Scannable format: 79% of users scan content, not read word-for-word
- Short paragraphs: 1-3 sentences max for mobile readability
- Bullet points/lists: Break up text, highlight key information
- Bold/italic: Emphasize important concepts (don't overuse)
- White space: Prevent overwhelming visual density

## SEO Optimization
- Primary keyword: Include naturally in headline, intro, headings
- Heading structure: H2/H3 tags that tell complete story when scanned
- Meta description: 150-160 characters, compelling and keyword-rich
- Internal links: Link to related content for better site structure
- External links: Include 2-3 authoritative sources for credibility

## Writing Approach
- Conversational tone: Use "you", contractions, rhetorical questions
- Active voice: More engaging than passive voice
- Concrete language: Specific words over vague generalities
- Evidence-based: Support claims with data, research, examples
- Actionable insights: Provide practical takeaways readers can implement`

          sendProgress({
            step: 'setup',
            status: 'completed',
            duration: Date.now() - setupStart
          })

          // Step 2: Content Generation with Web Search (if enabled)
          sendProgress({ step: 'web_search', status: 'starting' })
          const searchStart = Date.now()
          
          if (includeWebSearch) {
            sendProgress({
              step: 'web_search',
              status: 'completed',
              duration: Date.now() - searchStart,
              message: 'Will use Perplexity Sonar for fast web search'
            })
          } else {
            sendProgress({
              step: 'web_search',
              status: 'completed',
              duration: Date.now() - searchStart,
              message: 'Skipped - disabled'
            })
          }

          // Step 3: Content Generation
          sendProgress({ step: 'content_generation', status: 'starting' })
          const contentStart = Date.now()

          const systemMessage = `You are a professional blog writer specializing in AI tools and technology. Write a comprehensive, well-researched blog post about: ${prompt}

${includeWebSearch ? `RESEARCH REQUIREMENTS:
- Find specific information about actual AI tools, companies, features, pricing
- Include recent statistics, case studies, and real-world examples
- Look for authoritative sources like official websites, tech publications, research papers
- Gather concrete data points, user testimonials, and comparison information` : ''}

Follow these SEO guidelines:
${seoKnowledge}

CRITICAL REQUIREMENTS:
1. Write 2,000-3,000 words of in-depth, valuable content
2. Use conversational tone with "you", contractions, and active voice
3. Include specific examples, real tools, actual features, and practical use cases

LINKING REQUIREMENTS (MUST FOLLOW):
- Internal links (3-5): Use format [descriptive text](/gpts) or [descriptive text](/documents) or [descriptive text](/blog)
- External links (2-3): Use format [source name](https://actual-url.com) - link to real websites
- Example: "Check out our [AI productivity tools](/gpts)" or "According to [OpenAI's research](https://openai.com/research)"
- DO NOT use citation-style references like [1], [2], [3] - always use proper markdown links
- DO NOT put numbers in square brackets - that's for academic papers, not blog posts

IMAGE PLACEHOLDERS:
- Add [IMAGE: specific description] where visuals would help
- Be specific about what should be shown (e.g., "[IMAGE: Screenshot of ChatGPT-4 interface with code generation example]")

STRUCTURE YOUR BLOG POST:
1. Title (45-60 chars, professional, clear, avoid slang like "good vibe" or "ultimate")
2. Introduction (150-200 words, hook + clear value proposition)
3. 5-8 main sections with descriptive H2 headings
4. Include lists, comparisons, step-by-step guides
5. Strong conclusion with clear call-to-action

TITLE REQUIREMENTS:
- Professional tone, avoid casual slang or buzzwords
- Clear and specific about the topic
- Examples: "Getting Started with Claude Code", "Claude Code vs GitHub Copilot", "5 Claude Code Features for Developers"
- AVOID: "Ultimate", "Good Vibe", overly promotional language

TABLE FORMATTING (if using tables):
- Use proper markdown table syntax with pipes and hyphens
- Example of correct table format:
| Feature | Tool A | Tool B | Tool C |
|---------|--------|--------|--------|
| Price | $29/mo | $49/mo | Free |
| Users | 1-5 | Unlimited | 1 |
- Ensure columns align and all rows have same number of cells
- Keep cell content concise

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "Specific, SEO-optimized title",
  "content": "# Title\\n\\n## Introduction\\n\\nEngaging intro...\\n\\n[Your full blog with proper markdown, real links, specific examples]",
  "meta_description": "150-160 character description with main keyword",
  "category": "Choose one: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development, AI Tools, Strategy",
  "read_time": calculated number (total words / 200)
}

IMPORTANT: Include ACTUAL external links to real websites and proper internal links in the markdown format shown above.`

          // Choose model and API endpoint
          let modelToUse, apiEndpoint, apiKey
          
          if (includeWebSearch && PERPLEXITY_API_KEY) {
            // Use Perplexity for web search
            modelToUse = 'sonar'
            apiEndpoint = 'https://api.perplexity.ai/chat/completions'
            apiKey = PERPLEXITY_API_KEY
          } else {
            // Use OpenAI for regular generation (no search)
            modelToUse = 'gpt-4o'
            apiEndpoint = 'https://api.openai.com/v1/chat/completions'
            apiKey = OPENAI_API_KEY
          }
          
          // Estimate token usage for cost monitoring
          const estimatedPromptTokens = estimateTokenCount(systemMessage + prompt)
          console.log(`📊 Estimated tokens: ${estimatedPromptTokens} (model: ${modelToUse})`)
          
          const requestBody: any = {
            model: modelToUse,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: prompt }
            ],
            max_tokens: MAX_TOKENS,
            stream: !includeWebSearch, // Perplexity doesn't support streaming
            temperature: 0.7
          }

          // Add response format for OpenAI to ensure JSON
          if (!includeWebSearch) {
            requestBody.response_format = { type: "json_object" }
          }

          console.log(`📤 Sending request to ${includeWebSearch ? 'Perplexity' : 'OpenAI'} API...`)
          const apiRequestStart = Date.now()
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })

          const apiResponseTime = Date.now() - apiRequestStart
          console.log(`📥 API response received in ${apiResponseTime}ms`)

          if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`API error: ${response.status} - ${errorData}`)
          }

          sendProgress({
            step: 'content_generation',
            status: 'running',
            message: `API connected (${apiResponseTime}ms), generating long-form content...`
          })

          let accumulatedContent = ''
          let blogPost: any = {}

          // Handle non-streaming response from Perplexity
          if (includeWebSearch && PERPLEXITY_API_KEY) {
            console.log('📥 Processing Perplexity non-streaming response...')
            const responseData = await response.json()
            
            if (responseData.choices?.[0]?.message?.content) {
              accumulatedContent = responseData.choices[0].message.content
              console.log(`✅ Received complete response: ${accumulatedContent.length} characters`)
            } else {
              throw new Error('Unexpected Perplexity response format')
            }
          } 
          // Handle streaming response from OpenAI
          else {
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let chunkCount = 0
            let lastChunkTime = Date.now()

            if (!reader) {
              throw new Error('No response body reader available')
            }

            // Send real-time content updates
            sendProgress({
              step: 'content_generation',
              status: 'running',
              message: 'Generating comprehensive content...'
            })

            console.log('🚀 Starting streaming response processing...')

          while (true) {
            try {
              const chunkStartTime = Date.now()
              const { done, value } = await reader.read()
              
              if (done) {
                console.log(`✅ Streaming complete. Total chunks: ${chunkCount}, Final content length: ${accumulatedContent.length}`)
                break
              }

              chunkCount++
              const timeSinceLastChunk = Date.now() - lastChunkTime
              
              // Log if there are long delays between chunks
              if (timeSinceLastChunk > 5000) {
                console.log(`⚠️ Long delay detected: ${timeSinceLastChunk}ms between chunks`)
                sendProgress({
                  step: 'content_generation',
                  status: 'running',
                  message: `Processing... (${Math.round(timeSinceLastChunk/1000)}s delay)`
                })
              }

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  
                  if (data === '[DONE]') {
                    console.log('📝 Received [DONE] signal')
                    continue
                  }
                  
                  try {
                    const parsed = JSON.parse(data)
                    
                    // Handle both OpenAI and Perplexity response formats
                    let content = ''
                    
                    // OpenAI format
                    if (parsed.choices?.[0]?.delta?.content) {
                      content = parsed.choices[0].delta.content
                    }
                    // Perplexity format (non-streaming)
                    else if (parsed.choices?.[0]?.message?.content) {
                      content = parsed.choices[0].message.content
                      accumulatedContent = content // For non-streaming, use full content
                      break // Exit loop as we have the full response
                    }
                    
                    if (content) {
                      accumulatedContent += content
                      
                      // Send progress update every 1000 characters
                      if (accumulatedContent.length % 1000 === 0) {
                        sendProgress({
                          step: 'content_generation',
                          status: 'running',
                          message: `Generated ${accumulatedContent.length} characters (${Math.round(accumulatedContent.split(' ').length)} words)...`
                        })
                      }
                    }
                  } catch (parseError) {
                    // Skip logging for incomplete JSON chunks
                    if (!data.includes('"usage"')) {
                      console.log('Failed to parse SSE data:', data.slice(0, 100))
                    }
                  }
                }
              }

              lastChunkTime = Date.now()
              const chunkProcessTime = lastChunkTime - chunkStartTime
              
              // Log slow chunk processing
              if (chunkProcessTime > 1000) {
                console.log(`⚠️ Slow chunk processing: ${chunkProcessTime}ms for chunk ${chunkCount}`)
              }
            } catch (chunkError) {
              console.error('Error processing chunk:', chunkError)
              // Continue processing other chunks
              if (chunkCount > 5) {
                // If we've processed some chunks, try to continue
                break
              } else {
                // If early error, throw it
                throw chunkError
              }
            }
          }
          } // Close the else block for OpenAI streaming

          // Try to parse the final content as JSON blog post
          try {
            // Clean the accumulated content to handle potential formatting issues
            let cleanedContent = accumulatedContent.trim();
            
            // Extract JSON from the response
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonString = jsonMatch[0];
              blogPost = JSON.parse(jsonString);
              
              // Clean the content field to remove any escape sequences and citation references
              if (blogPost.content) {
                // Replace literal \n with actual newlines
                blogPost.content = blogPost.content
                  .replace(/\\n/g, '\n')
                  .replace(/\\\*/g, '*')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\')
                  .replace(/\\#/g, '#')
                  .replace(/\\-/g, '-')
                  .replace(/\\>/g, '>')
                  .replace(/\\`/g, '`')
                  .replace(/\\\[/g, '[')
                  .replace(/\\\]/g, ']')
                  .replace(/\\\(/g, '(')
                  .replace(/\\\)/g, ')')
                  // Remove citation-style references like [1], [2], etc.
                  .replace(/\[\d+\]/g, '');
              }
              
              // Ensure we have long-form content
              const wordCount = blogPost.content?.split(' ').length || 0
              if (wordCount < 1500) {
                console.warn(`Content too short: ${wordCount} words. Expected 2000-3000 words.`)
              }
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.error('Failed to parse blog JSON:', parseError);
            console.error('Raw content preview:', accumulatedContent.slice(0, 500));
            
            // Create a fallback blog post
            blogPost = {
              title: `${prompt.slice(0, 60)}...`,
              content: `# ${prompt}\n\nWe apologize, but there was an error generating this blog post. Please try again.`,
              meta_description: `Learn about ${prompt}. Expert insights and strategies.`.slice(0, 160),
              category: 'AI Tools',
              read_time: 5
            };
          }

          const finalWordCount = blogPost.content?.split(' ').length || 0
          sendProgress({
            step: 'content_generation',
            status: 'completed',
            duration: Date.now() - contentStart,
            message: `Generated ${finalWordCount} words of long-form content`
          })

          // Step 4: Enhanced Image Generation
          if (includeImages) {
            sendProgress({ step: 'image_generation', status: 'starting' })
            const imageStart = Date.now()

            try {
              // Extract image placeholders from content
              const imagePlaceholders = blogPost.content.match(/\[IMAGE: ([^\]]+)\]/g) || []
              const imageDescriptions = imagePlaceholders.map((placeholder: string) => 
                placeholder.replace(/\[IMAGE: ([^\]]+)\]/, '$1')
              )

              // Intelligently determine number of images based on content length and placeholders
              const contentWordCount = blogPost.content.split(' ').length
              const maxImages = Math.min(
                imagePlaceholders.length > 0 ? imagePlaceholders.length : 3, // Use placeholders if available
                contentWordCount > 1500 ? 3 : contentWordCount > 800 ? 2 : 1 // Or base on length
              )
              
              console.log(`📊 Blog analysis: ${contentWordCount} words, ${imagePlaceholders.length} placeholders → generating ${maxImages} images`)
              
              // Create image prompts for different sections
              const imagePrompts = []
              imagePrompts.push(`${blogPost.title}`) // Hero image
              
              if (maxImages > 1) {
                // Extract key sections for additional images
                const sections = blogPost.content.split(/##/).filter((section: string) => section.trim().length > 100)
                if (sections.length > 1 && maxImages > 1) {
                  imagePrompts.push(`supporting content for ${sections[1].split('\n')[0].trim()}`)
                }
                if (sections.length > 2 && maxImages > 2) {
                  imagePrompts.push(`visual guide for ${sections[2].split('\n')[0].trim()}`)
                }
              }

              sendProgress({
                step: 'image_generation',
                status: 'running',
                message: `Generating ${maxImages} HD image${maxImages > 1 ? 's' : ''} with DALL-E 3...`
              })

              // Generate high-quality, topic-specific images using DALL-E 3
              const imagePromises = imagePrompts.slice(0, maxImages).map(async (prompt: string, index: number) => {
                try {
                  // Create highly specific image prompts based on the actual blog content
                  let enhancedImagePrompt = ''
                  
                  // Analyze the blog title and content for specific tools and topics
                  const titleLower = blogPost.title.toLowerCase()
                  const contentLower = accumulatedContent.toLowerCase()
                  
                  // Extract specific tools mentioned in the content AND title (prioritize more specific matches first)
                  const aiTools = ['claude code', 'github copilot', 'notion ai', 'chatgpt', 'claude', 'midjourney', 'dall-e', 'runway', 'perplexity', 'jasper', 'copy.ai', 'writesonic', 'grammarly', 'cursor', 'replit', 'anthropic', 'openai']
                  const mentionedTools = aiTools.filter(tool => 
                    contentLower.includes(tool) || titleLower.includes(tool)
                  )
                  
                  // Brand-specific logo and visual elements mapping
                  const brandElements: Record<string, string> = {
                    'claude code': 'Claude Code interface with terminal/code editor, Claude logo (orange geometric design) prominently visible',
                    'claude': 'Claude AI logo (orange/coral geometric design), Anthropic branding',
                    'chatgpt': 'ChatGPT logo (circular green/teal design), OpenAI branding',
                    'openai': 'OpenAI logo and branding elements',
                    'midjourney': 'Midjourney logo and distinctive art generation interface',
                    'github copilot': 'GitHub Copilot logo, VS Code interface with Copilot suggestions',
                    'cursor': 'Cursor AI editor interface with distinctive branding',
                    'anthropic': 'Anthropic company logo and branding',
                    'perplexity': 'Perplexity AI logo and search interface',
                    'notion ai': 'Notion AI logo and workspace interface',
                    'notion': 'Notion logo and workspace interface',
                    'grammarly': 'Grammarly logo and writing assistant interface'
                  }
                  
                  // Detect primary brand for logo inclusion (now with improved priority)
                  let primaryBrand = ''
                  let brandVisuals = ''
                  for (const tool of mentionedTools) {
                    if (brandElements[tool]) {
                      primaryBrand = tool
                      brandVisuals = brandElements[tool]
                      break // Takes first match, which is now prioritized by specificity
                    }
                  }
                  
                  // Special priority for Claude Code in title (most common case)
                  if (titleLower.includes('claude code') && !primaryBrand) {
                    primaryBrand = 'claude code'
                    brandVisuals = brandElements['claude code']
                  }
                  
                  // Debug logging to see what's being detected
                  console.log('🔍 Brand detection debug:', {
                    blogTitle: blogPost.title,
                    titleLower,
                    contentPreview: contentLower.substring(0, 100) + '...',
                    mentionedTools,
                    primaryBrand,
                    brandVisuals: brandVisuals ? brandVisuals.substring(0, 50) + '...' : 'none'
                  })
                  
                  if (index === 0) {
                    // Hero image - main topic visualization with enhanced prompts and brand logos
                    const brandLogoText = primaryBrand ? ` Screen prominently displays ${brandVisuals} in clean, professional presentation.` : ''
                    
                    if (titleLower.includes('ai tools') || titleLower.includes('artificial intelligence')) {
                      enhancedImagePrompt = `Modern workspace with monitor showing AI tool interfaces.${brandLogoText} Purple accents, professional setup, photorealistic.`
                    } else if (titleLower.includes('productivity') || titleLower.includes('workflow')) {
                      enhancedImagePrompt = `Executive workspace with curved monitor showing productivity dashboard.${brandLogoText} Purple lighting, professional, photorealistic.`
                    } else if (titleLower.includes('marketing') || titleLower.includes('social media')) {
                      enhancedImagePrompt = `Creative studio with dual monitors showing social media interfaces.${brandLogoText} Purple studio lighting, photorealistic.`
                    } else if (titleLower.includes('writing') || titleLower.includes('content')) {
                      enhancedImagePrompt = `Writer's workspace with monitor showing writing interface.${brandLogoText} Purple accent lighting, photorealistic.`
                    } else if (titleLower.includes('business') || titleLower.includes('strategy')) {
                      enhancedImagePrompt = `Business workspace with monitor showing analytics dashboard.${brandLogoText} Purple theme, professional, photorealistic.`
                    } else if (titleLower.includes('automation') || titleLower.includes('workflow')) {
                      enhancedImagePrompt = `Tech workspace with screens showing automation interfaces.${brandLogoText} Purple neon accents, photorealistic.`
                    } else {
                      enhancedImagePrompt = `Professional workspace for "${blogPost.title}" with monitor showing relevant interface.${brandLogoText} Purple gradient theme, photorealistic.`
                    }
                  } else {
                    // Enhanced secondary content image - more specific visualization with brand logos
                    const secondaryBrandText = primaryBrand ? ` Interface prominently features ${brandVisuals} with professional presentation.` : ''
                    
                    if (mentionedTools.length > 0) {
                      const toolsList = mentionedTools.slice(0, 2).join(' and ')
                      enhancedImagePrompt = `${toolsList} interface on modern monitor.${secondaryBrandText} Clean UI, purple accents, professional workspace, photorealistic.`
                    } else if (contentLower.includes('comparison') || contentLower.includes('vs')) {
                      enhancedImagePrompt = `Side-by-side software comparison on dual monitors.${secondaryBrandText} Clean interfaces, purple accents, professional setup, photorealistic.`
                    } else if (contentLower.includes('step') || contentLower.includes('guide') || contentLower.includes('tutorial')) {
                      enhancedImagePrompt = `Tutorial interface with numbered steps on monitor.${secondaryBrandText} Clean layout, purple theme, professional workspace, photorealistic.`
                    } else if (contentLower.includes('analytics') || contentLower.includes('data') || contentLower.includes('metrics')) {
                      enhancedImagePrompt = `Analytics dashboard with charts on monitor.${secondaryBrandText} Purple gradient visuals, professional setup, photorealistic.`
                    } else {
                      enhancedImagePrompt = `Professional visualization of "${blogPost.title}" on monitor.${secondaryBrandText} Modern UI, purple gradients, clean workspace, photorealistic.`
                    }
                  }
                  
                  // Add timeout and performance optimizations
                  console.log(`🎨 Generating image ${index + 1} with DALL-E 3...`)
                  const imageStartTime = Date.now()
                  
                  const imageResponse = await Promise.race([
                    fetch('https://api.openai.com/v1/images/generations', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model: 'dall-e-3',
                        prompt: enhancedImagePrompt,
                        size: '1792x1024', // 16:9 widescreen aspect ratio perfect for blog hero images
                        quality: 'hd', // Maximum quality for crisp, detailed images
                        style: 'natural', // Photorealistic style for professional appearance
                        n: 1
                      })
                    }),
                    // 60-second timeout for image generation (reduced due to simpler prompts)
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Image generation timeout')), 60000)
                    )
                  ]) as Response

                  const imageGenerationTime = Date.now() - imageStartTime
                  console.log(`⚡ Image ${index + 1} generated in ${imageGenerationTime}ms`)

                  if (imageResponse.ok) {
                    const responseData = await imageResponse.json()
                    
                    if (responseData.data && responseData.data[0]?.url) {
                      console.log(`✅ Image ${index + 1} URL received successfully`)
                      return {
                        url: responseData.data[0].url,
                        prompt: enhancedImagePrompt,
                        description: index === 0 ? `Hero image for ${blogPost.title}` : `Supporting image ${index + 1} for ${blogPost.title}`,
                        placement: index === 0 ? 'hero' : 'content'
                      }
                    }
                  } else {
                    const errorText = await imageResponse.text()
                    console.error(`❌ Image generation failed: ${imageResponse.status} - ${errorText}`)
                  }
                  return null
                } catch (err) {
                  console.log(`Image generation failed for image ${index + 1}:`, err)
                  return null
                }
              })

              const generatedImages = await Promise.all(imagePromises)
              const filteredImages = generatedImages.filter(img => img !== null)
              
              // Store images permanently to prevent expiration (optimized)
              if (filteredImages.length > 0) {
                sendProgress({
                  step: 'image_generation',
                  status: 'running',
                  message: `Storing ${filteredImages.length} image(s) permanently...`
                })
                
                const storageStartTime = Date.now()
                console.log(`💾 Starting permanent storage for ${filteredImages.length} images...`)
                
                try {
                  // Store images with extended timeout and better error handling
                  blogPost.generated_images = await Promise.race([
                    imageStorageService.storeMultipleImages(filteredImages, blogPost.title),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Storage timeout')), 60000) // Reduced to 60 seconds for faster feedback
                    )
                  ]) as any
                  
                  const storageTime = Date.now() - storageStartTime
                  console.log(`✅ Stored ${blogPost.generated_images.length} images permanently in ${storageTime}ms`)
                  
                  // Validate that all images were stored successfully and URLs are accessible
                  const failedStorageCount = blogPost.generated_images.filter((img: any) => 
                    img.url.includes('oaidalleapiprodscus.blob.core.windows.net')
                  ).length
                  
                  if (failedStorageCount > 0) {
                    console.warn(`⚠️ ${failedStorageCount} images still using temporary URLs - storage may have failed`)
                    
                    // Test if temporary URLs are still accessible
                    for (const img of blogPost.generated_images) {
                      if (img.url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
                        try {
                          const testResponse = await fetch(img.url, { method: 'HEAD', timeout: 5000 } as any)
                          if (!testResponse.ok) {
                            console.error(`❌ Temporary image URL already expired: ${img.url}`)
                          }
                        } catch (error) {
                          console.error(`❌ Cannot access temporary image URL: ${img.url}`)
                        }
                      }
                    }
                    
                    // If more than half the images failed storage, better to have no images
                    if (failedStorageCount > blogPost.generated_images.length / 2) {
                      console.error(`❌ Too many storage failures (${failedStorageCount}/${blogPost.generated_images.length}) - removing all images`)
                      blogPost.generated_images = []
                    }
                  } else {
                    console.log(`✅ All ${blogPost.generated_images.length} images successfully stored with permanent URLs`)
                  }
                  
                } catch (storageError) {
                  const storageTime = Date.now() - storageStartTime
                  console.error(`❌ Image storage completely failed after ${storageTime}ms:`, storageError)
                  
                  // Instead of using temporary URLs, try to generate new images or fail gracefully
                  sendProgress({
                    step: 'image_generation',
                    status: 'error',
                    message: 'Image storage failed - blog will be created without images'
                  })
                  
                  blogPost.generated_images = [] // Better to have no images than broken ones
                }
              } else {
                blogPost.generated_images = []
              }

              // Intelligently distribute images throughout the content
              if (blogPost.generated_images.length > 0) {
                let contentWithImages = blogPost.content
                
                if (imagePlaceholders.length > 0) {
                  // Replace existing placeholders with generated images
                  blogPost.generated_images.forEach((image: any, index: number) => {
                    if (imagePlaceholders[index]) {
                      const imageAlt = index === 0 ? 'Blog hero image' : 
                                     index === 1 ? 'Supporting visual' : 
                                     'Additional illustration'
                      contentWithImages = contentWithImages.replace(
                        imagePlaceholders[index],
                        `![${image.description || imageAlt}](${image.url})`
                      )
                    }
                  })
                  
                  // Remove any remaining unused placeholders
                  imagePlaceholders.slice(blogPost.generated_images.length).forEach((placeholder: string) => {
                    contentWithImages = contentWithImages.replace(placeholder, '')
                  })
                } else {
                  // No placeholders - strategically insert images into content sections
                  const sections = contentWithImages.split('##').filter((section: string) => section.trim().length > 0)
                  
                  if (sections.length > 0) {
                    let rebuiltContent = sections[0] // Introduction
                    
                    // Insert hero image after introduction
                    if (blogPost.generated_images[0]) {
                      rebuiltContent += `\n\n![${blogPost.generated_images[0].description || 'Blog hero image'}](${blogPost.generated_images[0].url})\n\n`
                    }
                    
                    // Add remaining sections with images distributed
                    sections.slice(1).forEach((section: string, index: number) => {
                      rebuiltContent += '##' + section
                      
                      // Insert additional images after every 2nd section
                      const imageIndex = Math.floor(index / 2) + 1
                      if (imageIndex < blogPost.generated_images.length && index % 2 === 1) {
                        const image = blogPost.generated_images[imageIndex]
                        rebuiltContent += `\n\n![${image.description || 'Supporting visual'}](${image.url})\n\n`
                      }
                    })
                    
                    contentWithImages = rebuiltContent
                  }
                }
                
                blogPost.content = contentWithImages
              } else {
                // Remove all image placeholders if no images were generated
                let contentWithoutPlaceholders = blogPost.content
                imagePlaceholders.forEach((placeholder: string) => {
                  contentWithoutPlaceholders = contentWithoutPlaceholders.replace(placeholder, '')
                })
                blogPost.content = contentWithoutPlaceholders
              }

              sendProgress({
                step: 'image_generation',
                status: 'completed',
                duration: Date.now() - imageStart,
                message: `Generated ${blogPost.generated_images.length} images with proper placement`
              })
            } catch (err) {
              sendProgress({
                step: 'image_generation',
                status: 'error',
                duration: Date.now() - imageStart,
                message: 'Image generation failed'
              })
              blogPost.generated_images = []
            }
          } else {
            sendProgress({
              step: 'image_generation',
              status: 'completed',
              duration: 0,
              message: 'Skipped - disabled'
            })
          }

          // Step 5: Finalization
          sendProgress({ step: 'finalization', status: 'starting' })
          const finalizationStart = Date.now()

          // Add final formatting touches
          if (blogPost.content) {
            // Ensure proper spacing between sections
            blogPost.content = blogPost.content
              .replace(/\n##/g, '\n\n##')
              .replace(/\n###/g, '\n\n###')
              .replace(/\n\n\n+/g, '\n\n')
          }

          // Calculate accurate read time
          const words = blogPost.content?.split(' ').length || 0
          blogPost.read_time = Math.ceil(words / 200) // Average reading speed

          // Send final blog post data
          const finalData = {
            ...blogPost,
            word_count: words,
            total_duration: Date.now() - startTime
          }

          sendProgress({
            step: 'finalization',
            status: 'completed',
            duration: Date.now() - finalizationStart
          })

          // Send final result
          const finalResult = `data: ${JSON.stringify({ type: 'final_result', data: finalData })}\n\n`
          controller.enqueue(encoder.encode(finalResult))

        } catch (error) {
          console.error('Blog generation error:', error)
          sendProgress({
            step: 'error',
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          })
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Stream setup error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to setup blog generation stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}