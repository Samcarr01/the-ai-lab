import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { imageStorageService } from '@/lib/image-storage'

// SEO scoring function for blog posts
function calculateSEOScore(blogPost: any, wordCount: number): number {
  let score = 0
  let maxScore = 100
  
  // Title optimization (20 points)
  if (blogPost.title) {
    if (blogPost.title.length >= 30 && blogPost.title.length <= 60) score += 15
    else if (blogPost.title.length >= 20 && blogPost.title.length <= 70) score += 10
    else score += 5
    
    // Check for power words in title
    const powerWords = ['ultimate', 'complete', 'guide', 'best', 'top', 'proven', 'essential', 'advanced']
    if (powerWords.some(word => blogPost.title.toLowerCase().includes(word))) score += 5
  }
  
  // Meta description optimization (15 points)
  if (blogPost.meta_description) {
    if (blogPost.meta_description.length >= 120 && blogPost.meta_description.length <= 160) score += 15
    else if (blogPost.meta_description.length >= 100 && blogPost.meta_description.length <= 180) score += 10
    else score += 5
  }
  
  // Content length optimization (15 points)
  if (wordCount >= 2000 && wordCount <= 3000) score += 15
  else if (wordCount >= 1500 && wordCount <= 3500) score += 10
  else if (wordCount >= 1000) score += 5
  
  // Heading structure (15 points)
  if (blogPost.content) {
    const h2Count = (blogPost.content.match(/^## /gm) || []).length
    const h3Count = (blogPost.content.match(/^### /gm) || []).length
    
    if (h2Count >= 3 && h2Count <= 8) score += 10
    else if (h2Count >= 2) score += 5
    
    if (h3Count >= 2) score += 5
  }
  
  // Image optimization (10 points)
  if (blogPost.generated_images && blogPost.generated_images.length > 0) {
    score += Math.min(10, blogPost.generated_images.length * 3)
  }
  
  // Slug optimization (10 points)
  if (blogPost.slug) {
    if (blogPost.slug.length >= 15 && blogPost.slug.length <= 60 && blogPost.slug.includes('-')) score += 10
    else if (blogPost.slug.length >= 10 && blogPost.slug.includes('-')) score += 5
  }
  
  // Content quality indicators (15 points)
  if (blogPost.content) {
    // Check for lists
    const listCount = (blogPost.content.match(/^[-*+] /gm) || []).length
    if (listCount >= 3) score += 5
    
    // Check for code blocks or technical content
    if (blogPost.content.includes('```') || blogPost.content.includes('`')) score += 5
    
    // Check for proper paragraph structure
    const paragraphs = blogPost.content.split('\n\n').filter((p: string) => p.trim().length > 50)
    if (paragraphs.length >= 8) score += 5
  }
  
  return Math.round((score / maxScore) * 100)
}

// Configure for Node.js runtime with extended timeout for image generation
export const maxDuration = 300 // 5 minutes max for complex workflows with multiple images

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

// Security and cost limits
const MAX_PROMPT_LENGTH = 500
const MAX_KNOWLEDGE_BASE_LENGTH = 3000
const MAX_TOKENS = 16000 // Increased for longer content generation (≈12,000-16,000 tokens)
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

// Construct JSON from non-JSON AI response as fallback
function constructJSONFromText(content: string, originalPrompt: string): any | null {
  try {
    // Try to extract key information from the text response
    const titleMatch = content.match(/(?:title|heading)[:.]?\s*(.+)/i)
    const title = titleMatch ? titleMatch[1].trim().replace(/["""]/g, '') : originalPrompt.slice(0, 60)
    
    // Use the content as-is if it looks like blog content
    const blogContent = content.length > 500 ? content : `## ${title}\n\n${content}`
    
    return {
      title: title.slice(0, 60),
      content: blogContent,
      meta_description: `Learn about ${originalPrompt}. Expert insights and practical guidance.`.slice(0, 160),
      category: 'AI Tools',
      read_time: Math.max(2, Math.ceil(content.split(' ').length / 200))
    }
  } catch (error) {
    console.error('Failed to construct JSON from text:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { prompt, knowledgeBase, includeWebSearch = true, includeImages = true, imageCount = 2 } = body
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

📝 CONTENT LENGTH GUIDELINES:
1. Aim for comprehensive, detailed coverage of the topic
2. Write as much as needed to thoroughly explain the subject
3. Include multiple examples, case studies, and practical insights  
4. Focus on providing value rather than hitting a specific word count
5. Typical range: 1,200-2,500+ words depending on topic complexity
6. Quality and usefulness are more important than strict word count

CONTENT STRUCTURE GUIDELINES:
- Write 5-8 well-structured sections (H2 headings) as needed for the topic
- Add subsections (H3) where they enhance understanding
- Strong introduction with clear value proposition and overview
- Practical examples, screenshots, or code snippets where relevant  
- Conclusion with key takeaways and actionable next steps
- Use conversational tone with "you", contractions, and active voice
- Focus on being helpful and informative rather than hitting word targets

LINKING REQUIREMENTS (MUST FOLLOW):
- Internal links (3-5): Use format [descriptive text](/gpts) or [descriptive text](/documents) or [descriptive text](/blog)
- External links (2-3): Use format [source name](https://actual-url.com) - link to real websites
- Example: "Check out our [AI productivity tools](/gpts)" or "According to [OpenAI's research](https://openai.com/research)"
- DO NOT use citation-style references like [1], [2], [3] - always use proper markdown links
- DO NOT put numbers in square brackets - that's for academic papers, not blog posts

IMAGE PLACEHOLDERS:
- Add [IMAGE: specific description] where visuals would help
- Be specific about what should be shown (e.g., "[IMAGE: Screenshot of ChatGPT-4 interface with code generation example]")

STRUCTURE YOUR BLOG POST TO ENSURE 2,500+ WORDS:
1. Title (45-60 chars, professional, clear, avoid slang like "good vibe" or "ultimate")
2. Introduction (250-300 words minimum, compelling hook + clear value proposition + detailed outline)
3. 8-10 major sections with descriptive H2 headings (300-400 words EACH):
   - What is [Topic]? (400+ words: comprehensive definitions, background, historical context, importance)
   - Why [Topic] Matters Now (350+ words: current market trends, benefits, problems it solves, statistics)
   - Key Features and Components (400+ words: detailed feature breakdowns, technical specifications)
   - Complete Step-by-Step Implementation Guide (500+ words: actionable steps with detailed explanations)
   - Advanced Best Practices and Pro Tips (400+ words: expert strategies, optimization techniques)
   - Detailed Comparison with Alternatives (450+ words: comparison tables, pros/cons analysis)
   - Common Mistakes and How to Avoid Them (350+ words: real-world challenges with solutions)
   - Tools and Resources You Need (300+ words: specific tool recommendations, setup guides)
   - Real-World Case Studies and Examples (400+ words: detailed success stories, metrics)
   - Future Trends and What's Next (300+ words: predictions, upcoming developments)
4. Must include: detailed numbered lists, comparison tables, code examples, screenshot descriptions
5. Strong conclusion (250+ words) with comprehensive summary + clear call-to-action + next steps

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

💡 CONTENT QUALITY FOCUS:
Write comprehensive, valuable content that thoroughly covers the topic.
Include practical examples, actionable insights, and helpful details.
Quality and usefulness matter more than strict word count requirements.

🚨 CRITICAL: YOU MUST FORMAT YOUR RESPONSE AS VALID JSON - THE SYSTEM WILL REJECT NON-JSON RESPONSES

⚠️ CRITICAL JSON FORMAT REQUIREMENTS:
- Your response must be ONLY JSON - no explanatory text, markdown, or code blocks
- Start immediately with { and end with } 
- Do not wrap in \`\`\`json code blocks
- Do not add any text before or after the JSON object
- This is a JSON-only API endpoint - non-JSON responses will be rejected

FORMAT YOUR COMPLETE RESPONSE AS THIS EXACT JSON STRUCTURE (no additional text before or after):
{
  "title": "Professional, SEO-optimized title (45-60 characters)",
  "content": "## Introduction\\n\\nComprehensive 250+ word introduction with hook, value proposition, and detailed outline of what readers will learn...\\n\\n## What is [Topic]? (400+ words)\\n\\nDetailed definition, background, context, and importance...\\n\\n### Key Components\\n\\nSpecific subsection content...\\n\\n## Why [Topic] Matters Now (350+ words)\\n\\nCurrent trends, benefits, problems solved...\\n\\n## Complete Step-by-Step Guide (500+ words)\\n\\nActionable implementation steps...\\n\\n## [Continue with 6 more major sections]\\n\\n## Conclusion\\n\\nComprehensive 250+ word summary with clear call-to-action...",
  "meta_description": "Compelling 150-160 character description with primary keyword", 
  "category": "Business Planning",
  "read_time": 15
}

⚠️ JSON FORMATTING REQUIREMENTS:
- Start response with { and end with }
- Escape all quotes in content with \\"
- Escape all newlines in content with \\n  
- No text before the opening { or after the closing }
- Ensure content field contains 2,500+ words
- Double-check JSON syntax is valid before submitting

🚨 FINAL VALIDATION CHECKLIST:
✓ Response starts with { and ends with }
✓ All quotes properly escaped with \\"
✓ Content field contains 2,500+ words
✓ Valid JSON syntax (test parse before submitting)
✓ Include ACTUAL external links and internal links`

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
            temperature: 0.8
          }

          // Add response format for OpenAI to ensure JSON
          if (!includeWebSearch) {
            requestBody.response_format = { type: "json_object" }
          }

          console.log(`📤 Sending request to ${includeWebSearch ? 'Perplexity' : 'OpenAI'} API...`)
          console.log(`🔧 Model: ${modelToUse}, JSON Format Enforced: ${!includeWebSearch ? 'Yes (OpenAI)' : 'No (Perplexity)'}`)
          console.log(`📊 Request body keys: ${Object.keys(requestBody).join(', ')}`)
          
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
            console.error(`❌ API Error ${response.status}:`, errorData)
            console.error('🔍 Request details:', {
              endpoint: apiEndpoint,
              model: modelToUse,
              maxTokens: MAX_TOKENS,
              promptLength: systemMessage.length + prompt.length
            })
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
            let cleanedContent = accumulatedContent.trim()
            
            // Advanced content cleaning for various AI response formats
            cleanedContent = cleanedContent
              .replace(/^\`\`\`json\s*/i, '')     // Remove starting ```json
              .replace(/\s*\`\`\`\s*$/i, '')      // Remove ending ```
              .replace(/^\`\`\`\s*/i, '')         // Remove starting ```
              .replace(/^json\s*/i, '')        // Remove starting "json"
              .replace(/^Here is.*?:\s*/i, '') // Remove "Here is the JSON:" type prefixes
              .replace(/^The JSON.*?:\s*/i, '') // Remove "The JSON response is:" type prefixes
              .replace(/^\w+\s*:\s*/i, '')     // Remove other word prefixes
              .trim()
            
            console.log('🔍 Content parsing - Length:', cleanedContent.length)
            console.log('🔍 Content starts with:', cleanedContent.slice(0, 200))
            console.log('🔍 Content ends with:', cleanedContent.slice(-200))
            
            // TEMPORARY: Log full content for debugging JSON parsing issues
            if (cleanedContent.length < 20000) { // Only log if reasonable size
              console.log('📋 FULL CONTENT FOR DEBUGGING:')
              console.log('==========================================')
              console.log(cleanedContent)
              console.log('==========================================')
            }
            
            // Try multiple JSON extraction methods
            let jsonString = '';
            
            // Method 1: Look for complete JSON object
            const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
              console.log('✅ Method 1: Found JSON match')
            } else {
              // Method 2: Try to extract from markdown code blocks
              const codeBlockMatch = cleanedContent.match(/\`\`\`(?:json)?\s*(\{[\s\S]*\})\s*\`\`\`/i);
              if (codeBlockMatch) {
                jsonString = codeBlockMatch[1];
                console.log('✅ Method 2: Found JSON in code block')
              } else {
                // Method 3: Look for JSON starting after any text
                const jsonStartMatch = cleanedContent.match(/.*?(\{[\s\S]*\})/);
                if (jsonStartMatch) {
                  jsonString = jsonStartMatch[1];
                  console.log('✅ Method 3: Found JSON after text')
                } else {
                  // Method 4: Try to construct JSON from non-JSON response
                  console.log('⚠️ Method 4: Attempting to construct JSON from non-JSON response')
                  const constructedJSON = constructJSONFromText(cleanedContent, prompt)
                  if (constructedJSON) {
                    jsonString = JSON.stringify(constructedJSON)
                    console.log('✅ Method 4: Constructed JSON from text')
                  } else {
                    throw new Error('No JSON structure found and could not construct from response')
                  }
                }
              }
            }
            
            console.log('🔍 Attempting to parse JSON string length:', jsonString.length)
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
                
                // Remove duplicate title if it exists at the beginning of content (H1 format)
                if (blogPost.title && blogPost.content.startsWith(`# ${blogPost.title}`)) {
                  blogPost.content = blogPost.content.replace(`# ${blogPost.title}\n\n`, '');
                }
                
                // Also check for title appearing as first H2 heading
                const titleWords = blogPost.title.split(' ')
                const firstFewWords = titleWords.slice(0, 3).join(' ')
                if (blogPost.content.startsWith(`## ${firstFewWords}`)) {
                  const firstLine = blogPost.content.split('\n')[0]
                  blogPost.content = blogPost.content.replace(`${firstLine}\n\n`, '');
                }
              }
              
              // CHECK WORD COUNT (flexible acceptance)
              const wordCount = blogPost.content?.split(' ').length || 0
              console.log(`📊 WORD COUNT ANALYSIS: Generated ${wordCount} words`)
              console.log(`📝 Content preview (first 300 chars): ${blogPost.content?.slice(0, 300)}...`)
              
              if (wordCount < 300) {
                console.error(`🚨 CONTENT TOO SHORT: Only ${wordCount} words generated. This seems incomplete.`)
                console.log(`⚠️ This may indicate an AI generation issue rather than content length.`)
              } else if (wordCount < 800) {
                console.warn(`⚠️ Short content: ${wordCount} words - could be expanded for better coverage`)
              } else if (wordCount < 1500) {
                console.log(`✅ Moderate length: ${wordCount} words - good for focused topics`)
              } else {
                console.log(`✅ Comprehensive content: ${wordCount} words - excellent coverage`)
              }
              
              // Only reject if content is extremely short (likely an error)
              if (wordCount < 200) {
                throw new Error(`Content too minimal: ${wordCount} words. This may indicate a generation error.`)
              }
            
            // Validate the parsed JSON has required fields
            if (!blogPost.title || !blogPost.content || !blogPost.meta_description) {
              throw new Error('Parsed JSON missing required fields: title, content, or meta_description')
            }
            
            console.log('✅ Successfully parsed blog post JSON with title:', blogPost.title?.slice(0, 50))
          } catch (parseError) {
            console.error('❌ Failed to parse blog JSON:', parseError);
            console.error('📋 Full raw content received:', accumulatedContent);
            console.error('📊 Raw content length:', accumulatedContent.length);
            console.error('🔍 Content starts with:', accumulatedContent.slice(0, 200));
            console.error('🔍 Content ends with:', accumulatedContent.slice(-200));
            
            // Try to extract title from raw content as fallback
            let fallbackTitle = `${prompt.slice(0, 60)}...`
            const titleMatch = accumulatedContent.match(/title["\s]*:["\s]*([^"]+)/i)
            if (titleMatch) {
              fallbackTitle = titleMatch[1].slice(0, 80)
            }
            
            // Create a fallback blog post with debugging information
            const contentPreview = accumulatedContent.slice(0, 500).replace(/['"]/g, '').replace(/\n/g, ' ')
            blogPost = {
              title: fallbackTitle,
              content: `# ${fallbackTitle}\n\n**Note:** There was an issue with content generation. The AI generated ${accumulatedContent.length} characters but it couldn't be parsed as valid JSON.\n\n**Content Preview:**\n${contentPreview}${accumulatedContent.length > 500 ? '...' : ''}\n\n**Possible Issues:**\n- AI included text before or after the JSON\n- JSON syntax errors (missing quotes, commas)\n- Content too long causing truncation\n\nPlease try again with a simpler prompt or check the browser console for full details.`,
              meta_description: `Learn about ${prompt}. Expert insights and strategies.`.slice(0, 160),
              category: 'AI Tools',
              read_time: 3
            };
            
            // Send additional debug info
            sendProgress({
              step: 'content_generation',
              status: 'error',
              message: `JSON parsing failed. Received ${accumulatedContent.length} chars but couldn't parse as JSON.`
            })
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

              // Use user-selected image count (1-3)
              const contentWordCount = blogPost.content.split(' ').length
              const maxImages = Math.min(Math.max(1, imageCount), 3) // Ensure 1-3 range
              
              console.log(`📊 Blog analysis: ${contentWordCount} words, ${imagePlaceholders.length} placeholders → generating ${maxImages} images (user selected: ${imageCount})`)
              
              // Create image prompts for different sections - ALWAYS generate requested number
              const imagePrompts = []
              imagePrompts.push(`${blogPost.title}`) // Hero image
              
              if (maxImages > 1) {
                // Extract key sections for additional images
                const sections = blogPost.content.split(/##/).filter((section: string) => section.trim().length > 50)
                console.log(`📝 Found ${sections.length} sections for additional images`)
                
                // Add additional image prompts based on user selection
                for (let i = 1; i < maxImages; i++) {
                  if (sections.length > i && sections[i]) {
                    const sectionTitle = sections[i].split('\n')[0].trim()
                    imagePrompts.push(`supporting content for ${sectionTitle}`)
                  } else {
                    // ALWAYS create additional images even if not enough sections
                    const supportingPrompts = [
                      `key features and benefits of ${blogPost.title}`,
                      `practical applications and use cases for ${blogPost.title}`,
                      `comparison and analysis related to ${blogPost.title}`,
                      `step-by-step process for ${blogPost.title}`,
                      `advanced tips and best practices for ${blogPost.title}`
                    ]
                    imagePrompts.push(supportingPrompts[(i - 1) % supportingPrompts.length])
                  }
                }
              }
              
              // Ensure we ALWAYS have the requested number of image prompts
              while (imagePrompts.length < maxImages) {
                imagePrompts.push(`additional supporting visual for ${blogPost.title}`)
              }
              
              console.log(`🎨 Created ${imagePrompts.length} image prompts for ${maxImages} requested images:`, imagePrompts)
              console.log(`🔍 Debug imageCount flow: user selected ${imageCount} → maxImages ${maxImages} → prompts created ${imagePrompts.length}`)

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
                    'claude code': 'Claude Code interface with terminal windows, code editor, orange Claude logo prominently displayed, Anthropic branding elements',
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
                  
                  // Special priority for Claude Code in title (most common case) - override any other detection
                  if (titleLower.includes('claude code') || contentLower.includes('claude code')) {
                    primaryBrand = 'claude code'
                    brandVisuals = brandElements['claude code']
                  }
                  
                  // Also check for coding/development context with Claude mention
                  if (!primaryBrand && (titleLower.includes('claude') && (titleLower.includes('coding') || titleLower.includes('development') || titleLower.includes('programming')))) {
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
                      enhancedImagePrompt = `Modern minimalist workspace with ultra-wide monitor displaying AI tool interfaces.${brandLogoText} Soft purple ambient lighting, clean desk setup, professional studio photography quality, high detail, 8K resolution.`
                    } else if (titleLower.includes('productivity') || titleLower.includes('workflow')) {
                      enhancedImagePrompt = `Executive workspace with curved ultrawide monitor showing productivity dashboard with charts and metrics.${brandLogoText} Elegant purple LED backlighting, professional photography, high detail, 8K resolution.`
                    } else if (titleLower.includes('marketing') || titleLower.includes('social media')) {
                      enhancedImagePrompt = `Creative studio setup with dual 4K monitors displaying social media analytics and content creation interfaces.${brandLogoText} Warm purple studio lighting, professional photography, high detail, 8K resolution.`
                    } else if (titleLower.includes('claude code') || titleLower.includes('coding') || titleLower.includes('development')) {
                      enhancedImagePrompt = `Modern developer workspace with ultrawide monitor showing Claude Code interface with syntax highlighting and terminal.${brandLogoText} RGB purple keyboard backlighting, clean desk setup, professional photography, high detail, 8K resolution.`
                    } else if (titleLower.includes('writing') || titleLower.includes('content')) {
                      enhancedImagePrompt = `Elegant writer's workspace with curved monitor displaying modern writing interface with clean typography.${brandLogoText} Soft purple ambient lighting, minimal desk setup, professional photography, high detail, 8K resolution.`
                    } else if (titleLower.includes('business') || titleLower.includes('strategy')) {
                      enhancedImagePrompt = `Executive business workspace with large monitor showing analytics dashboard with KPI charts and metrics.${brandLogoText} Sophisticated purple accent lighting, professional photography, high detail, 8K resolution.`
                    } else if (titleLower.includes('automation') || titleLower.includes('workflow')) {
                      enhancedImagePrompt = `High-tech workspace with multiple screens displaying automation workflow interfaces and process diagrams.${brandLogoText} Cyberpunk purple neon accents, professional photography, high detail, 8K resolution.`
                    } else {
                      enhancedImagePrompt = `Premium professional workspace focused on "${blogPost.title}" with large monitor displaying relevant modern interface.${brandLogoText} Sophisticated purple gradient ambient lighting, professional studio photography, high detail, 8K resolution.`
                    }
                  } else {
                    // Enhanced secondary content image - more specific visualization with brand logos
                    const secondaryBrandText = primaryBrand ? ` Interface prominently features ${brandVisuals} with professional presentation.` : ''
                    
                    if (mentionedTools.length > 0) {
                      const toolsList = mentionedTools.slice(0, 2).join(' and ')
                      enhancedImagePrompt = `Close-up view of ${toolsList} interface on premium monitor with detailed UI elements visible.${secondaryBrandText} Clean modern design, subtle purple accents, professional studio lighting, high detail, 8K resolution.`
                    } else if (contentLower.includes('comparison') || contentLower.includes('vs')) {
                      enhancedImagePrompt = `Professional side-by-side software comparison displayed on dual 4K monitors with clear interface details.${secondaryBrandText} Clean UI layouts, subtle purple accent lighting, professional setup, high detail, 8K resolution.`
                    } else if (contentLower.includes('step') || contentLower.includes('guide') || contentLower.includes('tutorial')) {
                      enhancedImagePrompt = `Step-by-step tutorial interface displayed on large monitor with numbered workflow and clear instructions.${secondaryBrandText} Clean educational layout, soft purple theme, professional lighting, high detail, 8K resolution.`
                    } else if (contentLower.includes('analytics') || contentLower.includes('data') || contentLower.includes('metrics')) {
                      enhancedImagePrompt = `Detailed analytics dashboard with colorful charts and KPI metrics displayed on curved monitor.${secondaryBrandText} Data visualization with purple gradient accents, professional setup, high detail, 8K resolution.`
                    } else {
                      enhancedImagePrompt = `Supporting visual for "${blogPost.title}" showing relevant interface or concept on premium monitor.${secondaryBrandText} Modern UI design, elegant purple gradients, professional workspace, high detail, 8K resolution.`
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
                        style: 'vivid', // More detailed and creative style
                        response_format: 'url', // Ensure we get direct URLs
                        n: 1
                      })
                    }),
                    // 45-second timeout per image (more reasonable for DALL-E 3)
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Image generation timeout')), 45000)
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
                } catch (err: any) {
                  console.error(`❌ Image generation failed for image ${index + 1}:`, {
                    error: err.message,
                    prompt: `Image ${index + 1} for "${blogPost.title}"`,
                    index
                  })
                  
                  // Send progress update for failed image
                  sendProgress({
                    step: 'image_generation',
                    status: 'running',
                    message: `Image ${index + 1} failed: ${err.message}. Continuing with remaining images...`
                  })
                  
                  return null
                }
              })

              const generatedImages = await Promise.all(imagePromises)
              const filteredImages = generatedImages.filter(img => img !== null)
              
              console.log(`📊 Image generation results: ${generatedImages.length} promises → ${filteredImages.length} successful images`)
              console.log(`🔍 User requested ${imageCount} images → maxImages ${maxImages} → got ${filteredImages.length} successful images`)
              
              // Validate we got the expected number of images
              if (filteredImages.length !== maxImages) {
                console.warn(`⚠️ Image count mismatch: Expected ${maxImages}, got ${filteredImages.length}`)
                sendProgress({
                  step: 'image_generation',
                  status: 'running',
                  message: `Generated ${filteredImages.length} of ${maxImages} requested images. Some may have failed.`
                })
              } else {
                console.log(`✅ Perfect match: Generated exactly ${maxImages} images as requested`)
              }
              
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
                  // No placeholders - strategically insert images into content sections with improved distribution
                  const sections = contentWithImages.split('##').filter((section: string) => section.trim().length > 0)
                  
                  if (sections.length > 0) {
                    let rebuiltContent = sections[0] // Introduction
                    
                    // Insert hero image after introduction with better spacing
                    if (blogPost.generated_images[0]) {
                      rebuiltContent += `\n\n<div style="text-align: center; margin: 2rem 0;">\n\n![${blogPost.generated_images[0].description || 'Blog hero image'}](${blogPost.generated_images[0].url})\n\n</div>\n\n`
                    }
                    
                    // Add remaining sections with images strategically distributed
                    const remainingSections = sections.slice(1)
                    const remainingImages = blogPost.generated_images.slice(1)
                    
                    if (remainingSections.length > 0 && remainingImages.length > 0) {
                      // Improved distribution algorithm for better visual flow
                      const totalSections = remainingSections.length
                      const totalImages = remainingImages.length
                      
                      // Calculate optimal positions for images (avoid clustering)
                      const imagePositions: number[] = []
                      if (totalImages === 1) {
                        // Single image goes in middle
                        imagePositions.push(Math.floor(totalSections / 2))
                      } else if (totalImages === 2) {
                        // Two images spread evenly
                        imagePositions.push(Math.floor(totalSections / 3))
                        imagePositions.push(Math.floor((totalSections * 2) / 3))
                      } else {
                        // Three or more images spread throughout
                        for (let i = 0; i < totalImages; i++) {
                          const position = Math.floor((totalSections * (i + 1)) / (totalImages + 1))
                          imagePositions.push(position)
                        }
                      }
                      
                      remainingSections.forEach((section: string, index: number) => {
                        rebuiltContent += '##' + section
                        
                        // Insert image if this section index matches an image position
                        const imageIndex = imagePositions.indexOf(index)
                        if (imageIndex !== -1 && imageIndex < remainingImages.length) {
                          const image = remainingImages[imageIndex]
                          rebuiltContent += `\n\n<div style="text-align: center; margin: 2rem 0;">\n\n![${image.description || `Supporting visual ${imageIndex + 2}`}](${image.url})\n\n</div>\n\n`
                        }
                      })
                    } else {
                      // No additional images, just add sections
                      remainingSections.forEach((section: string) => {
                        rebuiltContent += '##' + section
                      })
                    }
                    
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

              const actualCount = blogPost.generated_images?.length || 0
              const successMessage = actualCount === maxImages 
                ? `✅ Generated exactly ${actualCount} of ${maxImages} requested images`
                : `⚠️ Generated ${actualCount} of ${maxImages} requested images (${maxImages - actualCount} failed)`
              
              sendProgress({
                step: 'image_generation',
                status: 'completed',
                duration: Date.now() - imageStart,
                message: `${successMessage} with proper placement`
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

          // Calculate accurate read time and enhanced SEO metrics
          const words = blogPost.content?.split(' ').length || 0
          blogPost.read_time = Math.ceil(words / 200) // Average reading speed
          
          // Enhanced SEO optimization
          if (blogPost.meta_description && blogPost.meta_description.length > 160) {
            // Trim meta description to optimal length
            blogPost.meta_description = blogPost.meta_description.substring(0, 157) + '...'
          }
          
          // Ensure slug is SEO-friendly
          if (blogPost.slug) {
            blogPost.slug = blogPost.slug
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/-+/g, '-') // Remove duplicate hyphens
              .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          }
          
          // Add structured data for better SEO
          const structuredData = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            'headline': blogPost.title,
            'description': blogPost.meta_description,
            'author': {
              '@type': 'Person',
              'name': 'thehackai'
            },
            'publisher': {
              '@type': 'Organization',
              'name': 'thehackai',
              'url': 'https://thehackai.com'
            },
            'wordCount': words,
            'timeRequired': `PT${blogPost.read_time}M`,
            'articleSection': blogPost.category || 'AI Tools',
            'image': blogPost.generated_images?.[0]?.url
          }

          // Send final blog post data with enhanced SEO
          const finalData = {
            ...blogPost,
            word_count: words,
            total_duration: Date.now() - startTime,
            structured_data: structuredData,
            seo_score: calculateSEOScore(blogPost, words)
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