import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Security and cost limits
const MAX_PROMPT_LENGTH = 1000
const MAX_KNOWLEDGE_BASE_LENGTH = 5000
const MAX_TOKENS = 3000 // Reduced from 4000 for cost savings
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

          let claudeContext = ''
          let seoKnowledge = ''
          let writingInstructions = ''

          try {
            const claudePath = join(process.cwd(), 'CLAUDE.md')
            claudeContext = await readFile(claudePath, 'utf-8')
          } catch (err) {
            console.log('CLAUDE.md not found')
          }

          try {
            const seoPath = join(process.cwd(), 'src/lib/knowledge/seo-best-practices.md')
            seoKnowledge = await readFile(seoPath, 'utf-8')
          } catch (err) {
            console.log('SEO knowledge file not found')
          }

          try {
            const instructionsPath = join(process.cwd(), 'src/lib/knowledge/ai-writing-instructions.md')
            writingInstructions = await readFile(instructionsPath, 'utf-8')
          } catch (err) {
            console.log('AI writing instructions file not found')
          }

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
              message: 'Will use gpt-4o-search-preview for web search'
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

          const systemMessage = `You are an expert blog writer for "The AI Lab", a subscription platform for curated AI documents and GPTs. 

PLATFORM CONTEXT:
${claudeContext}

AI WRITING INSTRUCTIONS (FOLLOW THESE EXACTLY):
${writingInstructions}

SEO BEST PRACTICES KNOWLEDGE:
${seoKnowledge}

ADDITIONAL KNOWLEDGE BASE:
${knowledgeBase || 'No additional knowledge base provided.'}

Write a high-quality blog post that:
1. Is engaging and informative
2. Targets professionals interested in AI tools and productivity
3. Is SEO-optimized with clear headings
4. Includes actionable insights
5. Maintains a professional but approachable tone
6. Is between 800-1500 words
7. Uses markdown formatting
8. Includes a compelling meta description (under 160 characters)
Return a JSON object with:
- title: Blog post title
- content: Full blog post content in markdown
- meta_description: SEO meta description
- category: Appropriate category from: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development, AI Tools, Strategy
- read_time: Estimated read time in minutes

${includeWebSearch ? 'Use web search to find the latest information and ensure accuracy and relevance.' : 'Focus on providing real value and actionable insights to readers.'}`

          // Hybrid approach: Use full gpt-4o for content quality, mini for other tasks
          const modelToUse = includeWebSearch ? 'gpt-4o-search-preview' : 'gpt-4o'
          
          // Estimate token usage for cost monitoring
          const estimatedPromptTokens = estimateTokenCount(systemMessage + prompt)
          console.log(`📊 Estimated tokens: ${estimatedPromptTokens} (model: ${modelToUse}) - PREMIUM QUALITY`)

          const requestBody: any = {
            model: modelToUse,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: MAX_TOKENS, // Use our cost-optimized limit
            stream: true // Enable streaming for better UX
          }

          // Add web search options if using search model (balanced context for quality)
          if (modelToUse === 'gpt-4o-search-preview') {
            requestBody.web_search_options = {
              search_context_size: "medium" // Balanced quality/cost for main content
            }
          }

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })

          if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
          }

          // Handle streaming response
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let accumulatedContent = ''
          let blogPost: any = {}

          if (!reader) {
            throw new Error('No response body reader available')
          }

          // Send real-time content updates
          sendProgress({
            step: 'content_generation',
            status: 'running',
            message: 'Streaming content...'
          })

          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') continue
                
                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  
                  if (content) {
                    accumulatedContent += content
                    
                    // Send live content updates (mobile-optimized chunks)
                    const contentUpdate = `data: ${JSON.stringify({
                      type: 'content_chunk',
                      content: content,
                      accumulated_length: accumulatedContent.length
                    })}\n\n`
                    controller.enqueue(encoder.encode(contentUpdate))
                  }
                } catch (parseError) {
                  console.log('Failed to parse SSE data:', data)
                }
              }
            }
          }

          // Try to parse the final content as JSON blog post
          try {
            blogPost = JSON.parse(accumulatedContent)
          } catch (parseError) {
            // If not JSON, create structured blog post
            blogPost = {
              title: 'AI-Generated Blog Post',
              content: accumulatedContent,
              meta_description: 'An AI-generated blog post about AI tools and strategies.',
              category: 'AI Tools',
              read_time: Math.ceil(accumulatedContent.split(' ').length / 200)
            }
          }

          sendProgress({
            step: 'content_generation',
            status: 'completed',
            duration: Date.now() - contentStart,
            message: `Generated ${aiContent.split(' ').length} words`
          })

          // Step 4: Image Generation (if enabled)
          if (includeImages) {
            sendProgress({ step: 'image_generation', status: 'starting' })
            const imageStart = Date.now()

            try {
              // First, analyze blog and suggest image ideas
              const imageAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini', // Use cheaper model for image analysis
                  messages: [
                    {
                      role: 'system',
                      content: 'Analyze blog content and suggest 2-3 professional image prompts for a tech blog.'
                    },
                    {
                      role: 'user',
                      content: `Create image prompts for: "${blogPost.title}". Return JSON array: ["prompt1", "prompt2", "prompt3"]`
                    }
                  ],
                  temperature: 0.5,
                  max_tokens: 300 // Reduced for cost savings
                })
              })

              if (imageAnalysisResponse.ok) {
                const analysisData = await imageAnalysisResponse.json()
                const analysisContent = analysisData.choices[0]?.message?.content
                
                let imagePrompts = []
                try {
                  imagePrompts = JSON.parse(analysisContent)
                } catch {
                  imagePrompts = [
                    `Professional illustration representing: ${blogPost.title}`,
                    `Modern tech-focused graphic about: ${blogPost.category}`,
                    `Clean business-style visual for: ${blogPost.meta_description}`
                  ]
                }

                // Generate images using Responses API with image_generation tool
                const imagePromises = imagePrompts.slice(0, 3).map(async (prompt: string, index: number) => {
                  try {
                    const imageResponse = await fetch('https://api.openai.com/v1/responses', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model: 'gpt-4o-mini', // Use cheaper model for image generation
                        input: `Generate a professional image: ${prompt}. Style: Clean, business-appropriate, tech blog suitable.`,
                        tools: [{
                          type: "image_generation",
                          size: "1024x1024",
                          quality: "medium" // Reduced from high for cost savings
                        }]
                      })
                    })

                    if (imageResponse.ok) {
                      const responseData = await imageResponse.json()
                      
                      // Find image generation results in the output
                      const imageGenerationCalls = responseData.output?.filter(
                        (output: any) => output.type === "image_generation_call"
                      )
                      
                      if (imageGenerationCalls?.length > 0 && imageGenerationCalls[0].result) {
                        // Convert base64 to data URL for display
                        const base64Image = imageGenerationCalls[0].result
                        const imageUrl = `data:image/png;base64,${base64Image}`
                        
                        return {
                          url: imageUrl,
                          prompt: prompt,
                          description: `Image ${index + 1} for blog post (gpt-image-1 generated via Responses API)`
                        }
                      }
                    }
                    return null
                  } catch (err) {
                    console.log(`Image generation failed for image ${index + 1}:`, err)
                    return null
                  }
                })

                const generatedImages = await Promise.all(imagePromises)
                blogPost.generated_images = generatedImages.filter(img => img !== null)

                sendProgress({
                  step: 'image_generation',
                  status: 'completed',
                  duration: Date.now() - imageStart,
                  message: `Generated ${blogPost.generated_images.length} images`
                })
              } else {
                sendProgress({
                  step: 'image_generation',
                  status: 'error',
                  duration: Date.now() - imageStart,
                  message: 'Image analysis failed'
                })
              }
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

          // Send final blog post data
          const finalData = {
            ...blogPost,
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
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