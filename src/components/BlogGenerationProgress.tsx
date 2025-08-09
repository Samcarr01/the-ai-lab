'use client'

import { useState, useEffect } from 'react'

interface ProgressStep {
  step: string
  status: 'starting' | 'running' | 'completed' | 'error'
  duration?: number
  message?: string
}

interface BlogGenerationProgressProps {
  prompt: string
  knowledgeBase: string
  includeWebSearch: boolean
  includeImages: boolean
  imageCount?: number // Number of images to generate (1-3)
  searchProvider?: 'perplexity'
  searchContextSize?: 'low' | 'medium' | 'high'
  onComplete: (blogPost: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

const stepConfig = {
  setup: {
    icon: '⚙️',
    title: 'Setup & Knowledge Loading',
    description: 'Initializing AI systems and loading knowledge base',
    color: 'from-blue-500 to-cyan-500'
  },
  web_search: {
    icon: '🌐',
    title: 'Web Search (Perplexity)',
    description: 'Gathering latest information from the web',
    color: 'from-green-500 to-emerald-500'
  },
  content_generation: {
    icon: '✍️',
    title: 'Content Generation',
    description: 'AI crafting your professional blog post',
    color: 'from-purple-500 to-pink-500'
  },
  image_generation: {
    icon: '🎨',
    title: 'Image Generation (DALL-E 3)',
    description: 'Creating high-quality images with AI',
    color: 'from-orange-500 to-red-500'
  },
  finalization: {
    icon: '✨',
    title: 'Finalization',
    description: 'Optimizing and finalizing your blog post',
    color: 'from-indigo-500 to-purple-500'
  }
}

export default function BlogGenerationProgress({
  prompt,
  knowledgeBase,
  includeWebSearch,
  includeImages,
  imageCount = 2,
  searchProvider = 'perplexity',
  searchContextSize = 'medium',
  onComplete,
  onError,
  onCancel
}: BlogGenerationProgressProps) {
  const [steps, setSteps] = useState<Record<string, ProgressStep>>({})
  const [currentStep, setCurrentStep] = useState<string>('')
  const [startTime] = useState(Date.now())
  const [totalElapsed, setTotalElapsed] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string>('')
  const [accumulatedLength, setAccumulatedLength] = useState(0)

  useEffect(() => {
    // Add abort controller for proper cleanup
    const abortController = new AbortController()
    let globalTimeout: NodeJS.Timeout
    
    const generateBlog = async () => {
      try {
        console.log('🚀 Starting blog generation request...')
        const requestStart = Date.now()
        
        // Set global timeout for the entire generation process
        globalTimeout = setTimeout(() => {
          abortController.abort()
          onError('Blog generation timed out after 5 minutes. Please try again with shorter content or fewer images.')
        }, 300000) // 5 minutes total timeout
        
        const response = await fetch('/api/ai/generate-blog-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal, // Add abort signal
          body: JSON.stringify({
            prompt,
            knowledgeBase,
            includeWebSearch,
            includeImages,
            imageCount,
            searchContextSize
          })
        })

        const responseTime = Date.now() - requestStart
        console.log(`📡 Initial response received in ${responseTime}ms`)

        if (!response.ok) {
          throw new Error('Failed to start blog generation')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body reader available')
        }

        console.log('📖 Starting to read streaming response...')
        let chunkCount = 0
        let lastChunkTime = Date.now()

        while (true) {
          const chunkStart = Date.now()
          console.log(`🔍 About to read chunk ${chunkCount + 1}...`)
          
          const { done, value } = await reader.read()
          const readTime = Date.now() - chunkStart
          console.log(`📥 Chunk read in ${readTime}ms`)
          
          if (done) {
            console.log(`✅ Streaming completed. Total chunks: ${chunkCount}`)
            break
          }

          chunkCount++
          const timeSinceLastChunk = Date.now() - lastChunkTime
          
          if (timeSinceLastChunk > 5000) {
            console.log(`⚠️ SLOW CHUNK: ${timeSinceLastChunk}ms gap before chunk ${chunkCount}`)
          }

          const decodeStart = Date.now()
          const chunk = decoder.decode(value)
          const decodeTime = Date.now() - decodeStart
          console.log(`🔤 Decode took ${decodeTime}ms, chunk size: ${chunk.length}`)
          
          const lines = chunk.split('\n')
          console.log(`📄 Processing ${lines.length} lines`)

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim()
              if (!dataStr) continue
              
              const parseStart = Date.now()
              try {
                const data = JSON.parse(dataStr)
                const parseTime = Date.now() - parseStart
                if (parseTime > 100) {
                  console.log(`⚠️ SLOW JSON PARSE: ${parseTime}ms for line: ${dataStr.slice(0, 50)}...`)
                }
                
                if (data.type === 'final_result') {
                  setIsComplete(true)
                  onComplete(data.data)
                  return
                }

                if (data.type === 'content_chunk') {
                  // Skip streaming content updates to test performance
                  console.log(`📝 Content chunk skipped: ${data.content.length} chars, total: ${data.accumulated_length}`)
                  return
                }

                // Handle progress updates
                console.log(`🔄 Progress update:`, data)
                setSteps(prev => ({
                  ...prev,
                  [data.step]: data
                }))
                
                if (data.status === 'starting' || data.status === 'running') {
                  console.log(`▶️ Starting step: ${data.step}`)
                  setCurrentStep(data.step)
                }

                if (data.status === 'error') {
                  console.error(`❌ Error in ${data.step}:`, data.message)
                  onError(data.message || `Error in ${data.step}`)
                  return
                }
              } catch (err) {
                console.log('Failed to parse SSE data:', line)
              }
            }
          }
          
          lastChunkTime = Date.now()
          const chunkProcessTime = lastChunkTime - chunkStart
          
          if (chunkProcessTime > 1000) {
            console.log(`⚠️ SLOW PROCESSING: ${chunkProcessTime}ms to process chunk ${chunkCount}`)
          }
        }
      } catch (error) {
        console.error('Blog generation failed:', error)
        if (error instanceof Error && error.name === 'AbortError') {
          onError('Blog generation was cancelled or timed out')
        } else {
          onError(error instanceof Error ? error.message : 'Unknown error occurred')
        }
      } finally {
        // Clean up timeout
        if (globalTimeout) {
          clearTimeout(globalTimeout)
        }
      }
    }

    generateBlog()

    // Update timer every 100ms
    const timer = setInterval(() => {
      setTotalElapsed(Date.now() - startTime)
    }, 100)

    return () => {
      // Proper cleanup to prevent memory leaks
      abortController.abort()
      clearInterval(timer)
      if (globalTimeout) {
        clearTimeout(globalTimeout)
      }
    }
  }, [prompt, knowledgeBase, includeWebSearch, includeImages, onComplete, onError, startTime])

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1) + 's'
  }

  const getStepStatus = (stepKey: string) => {
    const step = steps[stepKey]
    if (!step) return 'waiting'
    return step.status
  }

  const getStepDuration = (stepKey: string) => {
    const step = steps[stepKey]
    if (step?.duration) return step.duration
    if (currentStep === stepKey) return totalElapsed - Object.values(steps).reduce((acc, s) => acc + (s.duration || 0), 0)
    return 0
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-500/30 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
            🤖 AI Blog Generation
          </h3>
          <p className="text-sm text-gray-300">
            Total time: <span className="font-mono font-semibold text-purple-400">
              {formatTime(totalElapsed)}
            </span>
          </p>
        </div>
        
        {!isComplete && (
          <button
            onClick={onCancel}
            className="mt-3 sm:mt-0 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-400 hover:text-red-300 border border-red-500/50 rounded-lg hover:bg-red-900/30 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="space-y-3 sm:space-y-4">
        {Object.entries(stepConfig).map(([stepKey, config]) => {
          const status = getStepStatus(stepKey)
          const duration = getStepDuration(stepKey)
          const step = steps[stepKey]
          
          return (
            <div
              key={stepKey}
              className={`flex items-center p-4 sm:p-5 rounded-xl transition-all duration-500 transform hover:scale-[1.02] ${
                status === 'completed'
                  ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 shadow-md'
                  : status === 'starting' || status === 'running' || currentStep === stepKey
                  ? `bg-gradient-to-r ${config.color} bg-opacity-20 border border-purple-500/50 shadow-lg animate-pulse`
                  : status === 'error'
                  ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/50 shadow-md'
                  : 'bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-gray-600/50'
              }`}
            >
              {/* Step Icon and Info */}
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 mr-3 sm:mr-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg'
                      : status === 'starting' || status === 'running' || currentStep === stepKey
                      ? `bg-gradient-to-br ${config.color} text-white shadow-lg animate-bounce`
                      : status === 'error'
                      ? 'bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-lg'
                      : 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300'
                  }`}>
                    {status === 'completed' ? '✅' : status === 'error' ? '❌' : config.icon}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white text-sm sm:text-base truncate">
                        {config.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300 mt-1">
                        {step?.message || config.description}
                      </p>
                    </div>
                    
                    {/* Status and Duration */}
                    <div className="flex items-center mt-2 sm:mt-0 sm:ml-4">
                      {status === 'starting' || status === 'running' || currentStep === stepKey ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-purple-400 border-t-transparent mr-2"></div>
                          <span className="font-mono text-xs sm:text-sm text-purple-400 font-semibold">
                            {formatTime(duration)}
                          </span>
                        </div>
                      ) : status === 'completed' ? (
                        <span className="font-mono text-xs sm:text-sm text-green-400 font-semibold">
                          {formatTime(step?.duration || 0)}
                        </span>
                      ) : status === 'error' ? (
                        <span className="font-mono text-xs sm:text-sm text-red-400 font-semibold">
                          {formatTime(step?.duration || 0)}
                        </span>
                      ) : (
                        <span className="font-mono text-xs sm:text-sm text-gray-500">
                          waiting...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-100">Overall Progress</span>
          <span className="text-xs sm:text-sm text-gray-300">
            {Object.values(steps).filter(s => s.status === 'completed').length} / {Object.keys(stepConfig).length} steps
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 sm:h-3">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(Object.values(steps).filter(s => s.status === 'completed').length / Object.keys(stepConfig).length) * 100}%`
            }}
          ></div>
        </div>
      </div>

      {/* Mobile-optimized current step indicator */}
      <div className="mt-4 sm:hidden">
        {currentStep && !isComplete && (
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-purple-200">
                Currently: {stepConfig[currentStep as keyof typeof stepConfig]?.title}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}