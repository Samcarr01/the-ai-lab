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

          const systemMessage = `You are a professional blog writer. Write a high-quality blog post about: ${prompt}

${includeWebSearch ? 'Use web search to find current 2025 trends, statistics, and relevant information.' : ''}

Follow these SEO guidelines:
${seoKnowledge}

SPECIFIC REQUIREMENTS:
- Write 2,000-3,000 words of engaging, valuable content
- Use conversational tone with "you", contractions, and active voice
- Include practical examples and actionable tips
- Add 3-5 internal links: [relevant text](/gpts), [relevant text](/documents), [relevant text](/blog)
- Add 2-3 external links to authoritative sources
- Include [IMAGE: description] placeholders for visuals

STRUCTURE YOUR BLOG POST:
1. Title (60-70 chars, keyword near start)
2. Introduction (150-200 words, hook + value proposition)
3. 5-8 main sections with H2 headings
4. Subsections with H3 headings as needed
5. Conclusion with call-to-action

FORMAT YOUR RESPONSE AS JSON:
{
  "title": "SEO-optimized title here",
  "content": "# Title\\n\\n## Introduction\\n\\nYour intro text...\\n\\n## Section 1\\n\\nContent...\\n\\n[Continue with all sections]",
  "meta_description": "150-160 character description with keyword",
  "category": "Choose one: Business Planning, Productivity, Communication, Automation, Marketing, Design, Development, AI Tools, Strategy",
  "read_time": number (calculate: total words / 200)
}

Write clean markdown without escape characters. Focus on providing genuine value to readers.`

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
              
              // Clean the content field to remove any escape sequences
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
                  .replace(/\\\)/g, ')');
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

              // Generate only 1 hero image to stay within timeout and ensure quality
              const imagePrompts = [`${blogPost.title}`] // Just generate hero image with blog title

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
                      prompt: `Create a professional blog hero image for an article about ${blogPost.title}. The image should be modern, clean, and visually represent the topic through abstract or conceptual imagery. Use a purple and blue gradient color scheme. Style: minimalist, professional, tech-focused. No text, letters, or words in the image.`,
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