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
  searchProvider?: 'perplexity' | 'openai'
  searchContextSize?: 'low' | 'medium' | 'high'
  onComplete: (blogPost: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

const stepConfig = {
  setup: {
    icon: '🔧',
    title: 'Setup & Knowledge Loading',
    description: 'Loading instructions and knowledge base'
  },
  web_search: {
    icon: '🔍',
    title: 'Web Search',
    description: 'Searching for latest information'
  },
  content_generation: {
    icon: '📝',
    title: 'Content Generation',
    description: 'AI writing your blog post'
  },
  image_generation: {
    icon: '🎨',
    title: 'Image Generation',
    description: 'Creating relevant images'
  },
  finalization: {
    icon: '💾',
    title: 'Finalization',
    description: 'Preparing final output'
  }
}

export default function BlogGenerationProgress({
  prompt,
  knowledgeBase,
  includeWebSearch,
  includeImages,
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
    const eventSource = new EventSource('/api/ai/generate-blog-stream', {
      // Note: EventSource doesn't support POST with body directly
      // We'll need to handle this differently
    })

    // Since EventSource doesn't support POST with body, we'll use fetch with ReadableStream
    const generateBlog = async () => {
      try {
        console.log('🚀 Starting blog generation request...')
        const requestStart = Date.now()
        
        const response = await fetch('/api/ai/generate-blog-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            knowledgeBase,
            includeWebSearch,
            includeImages,
            searchProvider,
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
        onError(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    generateBlog()

    // Update timer every 100ms
    const timer = setInterval(() => {
      setTotalElapsed(Date.now() - startTime)
    }, 100)

    return () => {
      clearInterval(timer)
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
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
            🤖 AI Blog Generation
          </h3>
          <p className="text-sm text-gray-600">
            Total time: <span className="font-mono font-semibold text-purple-600">
              {formatTime(totalElapsed)}
            </span>
          </p>
        </div>
        
        {!isComplete && (
          <button
            onClick={onCancel}
            className="mt-3 sm:mt-0 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
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
              className={`flex items-center p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                status === 'completed'
                  ? 'bg-green-100 border border-green-200'
                  : status === 'starting' || status === 'running' || currentStep === stepKey
                  ? 'bg-purple-100 border border-purple-200 shadow-sm'
                  : status === 'error'
                  ? 'bg-red-100 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              {/* Step Icon and Info */}
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 mr-3 sm:mr-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl ${
                    status === 'completed'
                      ? 'bg-green-200 text-green-800'
                      : status === 'starting' || status === 'running' || currentStep === stepKey
                      ? 'bg-purple-200 text-purple-800'
                      : status === 'error'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {status === 'completed' ? '✅' : status === 'error' ? '❌' : config.icon}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {config.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {step?.message || config.description}
                      </p>
                    </div>
                    
                    {/* Status and Duration */}
                    <div className="flex items-center mt-2 sm:mt-0 sm:ml-4">
                      {status === 'starting' || status === 'running' || currentStep === stepKey ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-purple-600 border-t-transparent mr-2"></div>
                          <span className="font-mono text-xs sm:text-sm text-purple-600 font-semibold">
                            {formatTime(duration)}
                          </span>
                        </div>
                      ) : status === 'completed' ? (
                        <span className="font-mono text-xs sm:text-sm text-green-600 font-semibold">
                          {formatTime(step?.duration || 0)}
                        </span>
                      ) : status === 'error' ? (
                        <span className="font-mono text-xs sm:text-sm text-red-600 font-semibold">
                          {formatTime(step?.duration || 0)}
                        </span>
                      ) : (
                        <span className="font-mono text-xs sm:text-sm text-gray-400">
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
          <span className="text-xs sm:text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-xs sm:text-sm text-gray-600">
            {Object.values(steps).filter(s => s.status === 'completed').length} / {Object.keys(stepConfig).length} steps
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-purple-800">
                Currently: {stepConfig[currentStep as keyof typeof stepConfig]?.title}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}