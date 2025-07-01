'use client'

import { useState, useEffect } from 'react'

export default function PromptRefinerDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const sequence = [
    { type: 'user', text: 'Help me research b2b marketing' },
    { 
      type: 'bot', 
      text: `Research B2B marketing methods focusing on:
• Strategic approaches (ABM, demand gen)
• Content types (whitepapers, case studies)
• Key platforms (LinkedIn, industry forums)
• Success metrics

Structure with clear headings and examples.`
    }
  ]

  const typeText = (text: string, callback: () => void) => {
    setIsTyping(true)
    setDisplayedText('')
    let index = 0
    
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index])
        index++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        setTimeout(callback, 2000) // Pause before next step
      }
    }, 30) // Typing speed
  }

  useEffect(() => {
    const runSequence = () => {
      if (currentStep < sequence.length) {
        const currentItem = sequence[currentStep]
        typeText(currentItem.text, () => {
          setCurrentStep(prev => prev + 1)
        })
      } else {
        // Reset and loop
        setTimeout(() => {
          setCurrentStep(0)
          setDisplayedText('')
        }, 3000)
      }
    }

    runSequence()
  }, [currentStep])

  const currentItem = sequence[currentStep] || sequence[0]

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
        {currentStep >= 0 && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-medium">You</span>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-2 max-w-sm">
              <p className="text-sm text-gray-700">
                {currentStep === 0 ? displayedText : sequence[0].text}
              </p>
            </div>
          </div>
        )}

        {/* Bot Response */}
        {currentStep >= 1 && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 gradient-purple rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">🔧</span>
            </div>
            <div className="bg-purple-50 rounded-lg px-4 py-3 flex-1">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {currentStep === 1 ? displayedText : sequence[1].text}
                {currentStep === 1 && isTyping && (
                  <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse"></span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Show placeholder when resetting */}
        {currentStep >= sequence.length && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-300 border-t-purple-600"></div>
          </div>
        )}
      </div>
    </div>
  )
}