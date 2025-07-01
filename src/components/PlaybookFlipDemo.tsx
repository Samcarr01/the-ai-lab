'use client'

import { useState, useEffect, useRef } from 'react'

export default function PlaybookFlipDemo() {
  const [showContent, setShowContent] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setShowContent(true), 400) // Delay for smooth effect
        } else {
          setShowContent(false)
        }
      },
      { threshold: 0.3 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="h-full">
      <div className="relative w-full h-full bg-white rounded-2xl shadow-xl border border-purple-200 overflow-hidden"
           style={{
             background: showContent 
               ? 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,246,255,1) 100%)'
               : 'linear-gradient(135deg, rgba(243,244,246,1) 0%, rgba(229,231,235,1) 100%)',
             transition: 'all 800ms ease-out'
           }}>
        
        {/* Header - morphs from loading icon to title */}
        <div className="flex items-center space-x-3 p-6 pb-4">
          <div 
            className={`flex items-center justify-center rounded-xl shadow-lg transition-all duration-800 ease-out ${
              showContent 
                ? 'w-10 h-10 gradient-purple' 
                : 'w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400'
            }`}
          >
            <span className={`text-white transition-all duration-800 ${
              showContent ? 'text-lg' : 'text-3xl text-gray-600'
            }`}>📚</span>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <h3 className={`font-semibold transition-all duration-800 ease-out ${
              showContent 
                ? 'text-xl text-gray-900 opacity-100 translate-y-0' 
                : 'text-lg text-gray-500 opacity-60 translate-y-2'
            }`}>
              {showContent ? 'AI Developers Playbook' : 'Scroll to reveal playbook...'}
            </h3>
          </div>
        </div>

        {/* Content - morphs from empty space to chapters */}
        <div className="px-6 pb-6 space-y-4">
          {/* Chapter 1 */}
          <div className={`transition-all duration-1000 ease-out ${
            showContent 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95'
          }`} style={{ transitionDelay: showContent ? '200ms' : '0ms' }}>
            <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-lg p-4 border border-purple-100/50">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Chapter 1</h4>
                  <p className="text-sm text-gray-700">Introduction to AI-Driven Development</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter 3 */}
          <div className={`transition-all duration-1000 ease-out ${
            showContent 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95'
          }`} style={{ transitionDelay: showContent ? '400ms' : '0ms' }}>
            <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-lg p-4 border border-purple-100/50">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔮</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Chapter 3</h4>
                  <p className="text-sm text-gray-700">Mastering Vibe Coding</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter 5 */}
          <div className={`transition-all duration-1000 ease-out ${
            showContent 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-8 scale-95'
          }`} style={{ transitionDelay: showContent ? '600ms' : '0ms' }}>
            <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-lg p-4 border border-purple-100/50">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Chapter 5</h4>
                  <p className="text-sm text-gray-700">Architectural Patterns for AI Applications</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}