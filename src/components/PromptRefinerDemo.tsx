'use client'

import { useState, useEffect, useRef } from 'react'

export default function PromptRefinerDemo() {
  const [userText, setUserText] = useState('')
  const [botText, setBotText] = useState('')
  const [showUser, setShowUser] = useState(false)
  const [showBot, setShowBot] = useState(false)
  const [isTypingBot, setIsTypingBot] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const typeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const userPrompt = 'Help me research b2b marketing'
  const botResponse = `Research B2B marketing methods focusing on:
• Strategic approaches (ABM, demand gen)
• Content types (white papers, case studies)
• Key platforms (LinkedIn, industry forums)
• Success metrics

Structure with clear headings and examples.`

  const startDemo = () => {
    if (hasStarted || isCompleted) return // Only start once and don't restart if completed
    
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    
    // Reset state
    setUserText('')
    setBotText('')
    setShowUser(false)
    setShowBot(false)
    setIsTypingBot(false)
    setHasStarted(true)

    // Show user message first
    setShowUser(true)
    setUserText(userPrompt)

    // Start bot typing after pause
    timerRef.current = setTimeout(() => {
      setShowBot(true)
      typeBot()
    }, 1500)
  }

  const typeBot = () => {
    setIsTypingBot(true)
    setBotText('')
    let index = 0
    
    const typeChar = () => {
      if (index < botResponse.length) {
        setBotText(botResponse.slice(0, index + 1))
        index++
        typeTimerRef.current = setTimeout(typeChar, 50)
      } else {
        setIsTypingBot(false)
        setIsCompleted(true) // Mark as completed so it never restarts
        
        // Disconnect observer to prevent any future triggers
        if (observerRef.current) {
          observerRef.current.disconnect()
          observerRef.current = null
        }
      }
    }
    
    typeChar()
  }

  useEffect(() => {
    if (isCompleted) return // Don't create observer if already completed

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted && !isCompleted) {
            startDemo()
          }
        })
      },
      { threshold: 0.3 } // Start when 30% visible
    )

    observerRef.current = observer

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    }
  }, [hasStarted, isCompleted])

  return (
    <div ref={containerRef} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100/50 h-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">🔧</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">PromptRefiner</h3>
      </div>
      
      <div className="bg-gray-50/50 rounded-xl p-4 space-y-3 min-h-[280px] max-h-[350px] overflow-y-auto">
        {/* User Message */}
        {showUser && (
          <div className="flex justify-end">
            <div className="flex items-end space-x-2 max-w-[85%]">
              <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 shadow-sm">
                <p className="text-sm">{userText}</p>
              </div>
              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">You</span>
              </div>
            </div>
          </div>
        )}

        {/* Bot Response */}
        {showBot && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2 max-w-[85%]">
              <div className="w-7 h-7 gradient-purple rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">🔧</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                  {botText}
                  {isTypingBot && (
                    <span className="inline-block w-1 h-4 bg-purple-500 ml-1 animate-pulse rounded-sm"></span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}