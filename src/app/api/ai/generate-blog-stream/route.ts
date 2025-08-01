import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

          // Enhanced SEO knowledge for long-form content
          const seoKnowledge = `
# SEO Blog Writing Essentials for Long-Form Content

## Blog Structure & Length
- **Target length: 2,000-3,000 words** for comprehensive coverage and SEO performance
- **Headline**: 60-70 characters, include primary keyword near beginning
- **Introduction**: Hook reader in first 10-15 seconds, outline what they'll learn
- **Body Structure**:
  - 5-8 main sections with H2 headings
  - 2-4 subsections with H3 headings under each H2
  - Each section: 200-400 words
  - Use transition phrases between sections
- **Conclusion**: Summarize key takeaways, reinforce main points, strong CTA

## Content Quality Requirements
- **Scannable format**: Use visual hierarchy with clear headings
- **Paragraph length**: 2-4 sentences max for readability
- **Lists and bullets**: At least 2-3 lists per 1,000 words
- **Visual breaks**: Use bold, italics, blockquotes for emphasis
- **Examples**: Include real-world examples and case studies
- **Data and stats**: Cite sources with [links](url) format

## Advanced SEO Optimization
- **Keyword density**: Primary keyword 1-2% density
- **LSI keywords**: Include related semantic keywords naturally
- **Internal linking**: 3-5 internal links to relevant pages
- **External linking**: 2-3 authoritative external sources
- **Meta description**: 150-160 characters with primary keyword
- **Featured snippets**: Format content for position zero
  - Use "What is" sections
  - Include definition boxes
  - Create numbered/bulleted lists

## Writing Approach for Long-Form
- **Comprehensive coverage**: Answer all related questions
- **Logical flow**: Each section builds on previous
- **Engaging style**: Mix short and medium sentences
- **Practical value**: Include actionable tips and how-tos
- **Expert positioning**: Demonstrate deep knowledge
- **Storytelling**: Use anecdotes to illustrate points
`

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

          const systemMessage = `You are an expert SEO blog writer for "thehackai" - a subscription platform for AI tools and guides.

TARGET: Professionals interested in AI productivity tools
CATEGORIES: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development, AI Tools, Strategy

SEO BEST PRACTICES:
${seoKnowledge}

${knowledgeBase ? `ADDITIONAL CONTEXT: ${knowledgeBase.slice(0, 1000)}` : ''}

REQUIREMENTS FOR LONG-FORM CONTENT:
- Write **2,000-3,000 words** of high-quality, comprehensive content
- Use proper markdown formatting with clear hierarchy
- Structure with 5-8 main sections (H2) and subsections (H3)
- Include practical examples, case studies, and actionable tips
- Format content for featured snippets (definitions, lists, tables)
- Add image placeholders with [IMAGE: description] tags
- Use transition phrases between sections for flow
- Include at least 3 lists or bullet points
- Add 3-5 internal links: [relevant text](/gpts), [relevant text](/documents), [relevant text](/blog)
- Include 2-3 external links to authoritative sources
- Use **bold** for key points and *italics* for emphasis
- Create engaging subheadings that tell a story
- End with a compelling conclusion and clear CTA

FORMATTING EXAMPLES:
- Lists with proper spacing
- Code blocks with \`\`\` when relevant
- Blockquotes with > for expert quotes
- Tables using markdown table syntax when comparing options

You MUST return ONLY valid JSON with this exact structure:
{
  "title": "SEO-optimized title (60-70 chars, keyword near start)",
  "content": "# Title Here\\n\\n## Introduction\\n\\nEngaging intro paragraph that hooks the reader and outlines what they'll learn...\\n\\n## What is [Topic]?\\n\\nDefinition and overview for featured snippet...\\n\\n## Section 1 Title\\n\\nComprehensive content with examples...\\n\\n### Subsection 1.1\\n\\nDetailed explanation...\\n\\n[IMAGE: Relevant diagram showing concept]\\n\\n### Subsection 1.2\\n\\n- Bullet point 1\\n- Bullet point 2\\n- Bullet point 3\\n\\n## Section 2 Title\\n\\nMore content with [internal link](/gpts)...\\n\\n### Real-World Example\\n\\n> \\"Quote from expert or case study\\"\\n\\n## How to Implement [Topic]\\n\\n1. Step one with details\\n2. Step two with explanation\\n3. Step three with tips\\n\\n[IMAGE: Step-by-step process diagram]\\n\\n## Common Mistakes to Avoid\\n\\n- Mistake 1 and why it matters\\n- Mistake 2 and how to fix it\\n\\n## Best Practices\\n\\n### Practice 1\\nDetailed explanation...\\n\\n### Practice 2\\nMore details...\\n\\n## Tools and Resources\\n\\n| Tool | Purpose | Price |\\n|------|---------|-------|\\n| Tool 1 | Description | Free/Paid |\\n| Tool 2 | Description | Price |\\n\\n## Conclusion\\n\\nSummarize key points and reinforce value...\\n\\n**Ready to transform your [topic]?** Explore our [AI GPTs collection](/gpts) and [downloadable playbooks](/documents) to take your skills to the next level.\\n\\n---\\n\\n*Want unlimited access to cutting-edge AI tools? [Upgrade to Pro](/upgrade) and join thousands of professionals leveraging AI for success.*",
  "meta_description": "Comprehensive meta description (150-160 chars) with keyword",
  "category": "One category from: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development, AI Tools, Strategy",
  "read_time": 10
}

${includeWebSearch ? 'Use web search to find latest statistics, trends, tools, and expert opinions. Include current year (2025) data when relevant.' : 'Focus on timeless strategies and proven methods.'}

CRITICAL: Return ONLY the JSON object, no other text or markdown. The content must be 2,000-3,000 words.`

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
            stream: true,
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

          // Handle streaming response
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let accumulatedContent = ''
          let blogPost: any = {}
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
                    const content = parsed.choices?.[0]?.delta?.content || ''
                    
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
                    console.log('Failed to parse SSE data:', data.slice(0, 100))
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

          // Try to parse the final content as JSON blog post
          try {
            // First try to extract JSON from the response
            const jsonMatch = accumulatedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              blogPost = JSON.parse(jsonMatch[0]);
              
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
            // If not JSON, create a structured blog post from the content
            const lines = accumulatedContent.split('\n');
            const title = lines[0]?.replace(/^#\s*/, '') || `AI Tools Guide: ${prompt.slice(0, 50)}...`;
            
            blogPost = {
              title: title.slice(0, 70),
              content: accumulatedContent || `# ${title}\n\n## Introduction\n\nContent generation failed. Please try again.`,
              meta_description: `Learn about ${prompt}. Expert insights on AI tools, strategies, and best practices.`.slice(0, 160),
              category: 'AI Tools',
              read_time: Math.ceil(accumulatedContent.split(' ').length / 200)
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

              // Generate 1-2 relevant images to stay within timeout
              const imagePrompts = imageDescriptions.length > 0 
                ? imageDescriptions.slice(0, 2) // Limit to 2 images max
                : [`Hero image for blog post: ${blogPost.title}`] // Just hero image

              sendProgress({
                step: 'image_generation',
                status: 'running',
                message: `Generating ${imagePrompts.length} images...`
              })

              // Generate images using DALL-E 3 (limit to 1 for speed)
              const imagePromises = imagePrompts.slice(0, 1).map(async (prompt: string, index: number) => {
                try {
                  const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${OPENAI_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'dall-e-3',
                      prompt: `Professional blog illustration: ${prompt}. Style: Modern, clean, minimalist, tech-focused, purple/blue gradient accents, high quality, no text or words in image.`,
                      size: '1792x1024', // 16:9 aspect ratio for blog hero images
                      quality: 'standard',
                      n: 1
                    })
                  })

                  if (imageResponse.ok) {
                    const responseData = await imageResponse.json()
                    
                    if (responseData.data && responseData.data[0]?.url) {
                      return {
                        url: responseData.data[0].url,
                        prompt: prompt,
                        description: `Image ${index + 1}: ${prompt}`,
                        placement: index === 0 ? 'hero' : 'content'
                      }
                    }
                  } else {
                    console.error(`Image generation failed: ${imageResponse.status}`, await imageResponse.text())
                  }
                  return null
                } catch (err) {
                  console.log(`Image generation failed for image ${index + 1}:`, err)
                  return null
                }
              })

              const generatedImages = await Promise.all(imagePromises)
              blogPost.generated_images = generatedImages.filter(img => img !== null)

              // Replace image placeholders with actual images
              if (blogPost.generated_images.length > 0) {
                let contentWithImages = blogPost.content
                blogPost.generated_images.forEach((img: any, index: number) => {
                  if (index < imagePlaceholders.length) {
                    contentWithImages = contentWithImages.replace(
                      imagePlaceholders[index],
                      `![${img.description}](${img.url})`
                    )
                  }
                })
                blogPost.content = contentWithImages
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