import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface ProgressStep {
  step: string
  status: 'starting' | 'running' | 'completed' | 'error'
  duration?: number
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, knowledgeBase, includeWebSearch = true, includeImages = true } = body

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

          // Step 2: Web Search (if enabled)
          let webSearchResults = ''
          if (includeWebSearch) {
            sendProgress({ step: 'web_search', status: 'starting' })
            const searchStart = Date.now()

            if (!process.env.TAVILY_API_KEY) {
              webSearchResults = 'Web search disabled: TAVILY_API_KEY not configured'
              sendProgress({
                step: 'web_search',
                status: 'completed',
                duration: Date.now() - searchStart,
                message: 'Skipped - API key not configured'
              })
            } else {
              try {
                const searchResponse = await fetch(`https://api.tavily.com/search`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
                  },
                  body: JSON.stringify({
                    query: prompt,
                    search_depth: 'advanced',
                    max_results: 5,
                    include_answer: true
                  })
                })
                
                if (searchResponse.ok) {
                  const searchData = await searchResponse.json()
                  webSearchResults = JSON.stringify(searchData.results || [])
                  sendProgress({
                    step: 'web_search',
                    status: 'completed',
                    duration: Date.now() - searchStart,
                    message: `Found ${searchData.results?.length || 0} results`
                  })
                } else {
                  webSearchResults = 'Web search failed: API error'
                  sendProgress({
                    step: 'web_search',
                    status: 'error',
                    duration: Date.now() - searchStart,
                    message: 'API error'
                  })
                }
              } catch (err) {
                webSearchResults = 'Web search failed: Network error'
                sendProgress({
                  step: 'web_search',
                  status: 'error',
                  duration: Date.now() - searchStart,
                  message: 'Network error'
                })
              }
            }
          } else {
            sendProgress({
              step: 'web_search',
              status: 'completed',
              duration: 0,
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

WEB SEARCH RESULTS (LATEST INFORMATION):
${webSearchResults}

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

Focus on providing real value and actionable insights to readers. Use the latest web search information to ensure accuracy and relevance.`

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 4000
            })
          })

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`)
          }

          const data = await response.json()
          const aiContent = data.choices[0]?.message?.content

          if (!aiContent) {
            throw new Error('No content generated by AI')
          }

          let blogPost
          try {
            blogPost = JSON.parse(aiContent)
          } catch (parseError) {
            blogPost = {
              title: 'AI-Generated Blog Post',
              content: aiContent,
              meta_description: 'An AI-generated blog post about AI tools and strategies.',
              category: 'AI Tools',
              read_time: Math.ceil(aiContent.split(' ').length / 200)
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
                  model: 'gpt-4o',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are an expert at analyzing blog content and suggesting relevant, professional images that would enhance the article. Create detailed, specific image prompts that would be perfect for the blog content.'
                    },
                    {
                      role: 'user',
                      content: `Analyze this blog post and suggest 2-3 specific image prompts that would perfectly complement the content. Make the prompts detailed and professional, suitable for a business/tech blog.

Blog Title: ${blogPost.title}
Blog Content: ${blogPost.content}

Return a JSON array of image prompt strings: ["prompt1", "prompt2", "prompt3"]`
                    }
                  ],
                  temperature: 0.7,
                  max_tokens: 500
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

                // Generate images using DALL-E 3
                const imagePromises = imagePrompts.slice(0, 3).map(async (prompt: string, index: number) => {
                  try {
                    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model: 'dall-e-3',
                        prompt: `${prompt}. Style: Professional, clean, business-appropriate, suitable for a tech blog. High quality, modern design.`,
                        n: 1,
                        size: '1024x1024',
                        quality: 'standard'
                      })
                    })

                    if (imageResponse.ok) {
                      const imageData = await imageResponse.json()
                      const imageUrl = imageData.data?.[0]?.url
                      
                      if (imageUrl) {
                        return {
                          url: imageUrl,
                          prompt: prompt,
                          description: `Image ${index + 1} for blog post`
                        }
                      }
                    }
                    return null
                  } catch (err) {
                    console.log(`Image ${index + 1} generation failed:`, err)
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