'use client'

import { useState, useEffect, useRef } from 'react'

export default function PromptRefinerDemo() {
  const [userText, setUserText] = useState('')
  const [botText, setBotText] = useState('')
  const [showUser, setShowUser] = useState(false)
  const [showBot, setShowBot] = useState(false)
  const [isTypingBot, setIsTypingBot] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const typeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const userPrompt = 'Help me research b2b marketing'
  const botResponse = `Research B2B marketing methods focusing on:
• Strategic approaches (ABM, demand gen)
• Content types (white papers, case studies)
• Key platforms (LinkedIn, industry forums)
• Success metrics

Structure with clear headings and examples.`

  const startDemo = () => {
    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    
    // Reset state
    setUserText('')
    setBotText('')
    setShowUser(false)
    setShowBot(false)
    setIsTypingBot(false)

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
        // Pause before restarting
        timerRef.current = setTimeout(startDemo, 8000)
      }
    }
    
    typeChar()
  }

  useEffect(() => {
    startDemo()
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current)
    }
  }, [])

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100/50 h-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">🔧</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">PromptRefiner</h3>
      </div>
      
      <div className="bg-gray-50/80 rounded-xl p-4 space-y-4 min-h-[200px]">
        {/* User Message */}
        {showUser && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-medium">You</span>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-2 max-w-sm">
              <p className="text-sm text-gray-700">{userText}</p>
            </div>
          </div>
        )}

        {/* Bot Response */}
        {showBot && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 gradient-purple rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🔧</span>
            </div>
            <div className="bg-purple-50 rounded-lg px-4 py-3 flex-1">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {botText}
                {isTypingBot && (
                  <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}