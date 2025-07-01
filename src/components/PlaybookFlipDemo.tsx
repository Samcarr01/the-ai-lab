'use client'

import { useState, useEffect, useRef } from 'react'

export default function PlaybookFlipDemo() {
  const [isFlipped, setIsFlipped] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Start flip animation immediately when visible
          setIsFlipped(true)
        } else {
          // Reset when out of view
          setIsFlipped(false)
          setAnimationProgress(0)
        }
      },
      { threshold: 0.3 } // Trigger when 30% visible for more responsiveness
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Handle the animation progress for scale effect
  useEffect(() => {
    if (isFlipped) {
      const timer = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 1) {
            clearInterval(timer)
            return 1
          }
          return prev + 0.08 // Faster progress increase
        })
      }, 16) // ~60fps
      
      return () => clearInterval(timer)
    } else {
      setAnimationProgress(0)
    }
  }, [isFlipped])

  // Calculate transform values 
  const rotateY = isFlipped ? 180 : 0
  const scale = 0.9 + (animationProgress * 0.1) // Scale from 0.9 to 1.0 (less dramatic)
  const opacity = 0.9 + (animationProgress * 0.1) // Opacity from 0.9 to 1.0 (less dramatic)

  return (
    <div ref={containerRef} className="h-full perspective-1000">
      <div 
        className="relative w-full h-full transform-style-preserve-3d transition-all duration-700 ease-out"
        style={{
          transform: `rotateY(${rotateY}deg) scale(${scale})`,
          opacity: opacity
        }}
      >
        {/* Front Side - Blank/Loading */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-xl border border-gray-300/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg">
              <span className="text-3xl text-gray-600">📚</span>
            </div>
            <div className="text-gray-500 font-medium">
              Scroll to reveal playbook...
            </div>
          </div>
        </div>

        {/* Back Side - Playbook Content */}
        <div 
          className="absolute inset-0 backface-hidden bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-purple-200/50"
          style={{
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,248,255,0.95) 100%)'
          }}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">AI Developers Playbook</h3>
          </div>

          <div className="space-y-4">
            {/* Chapter 1 */}
            <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-lg p-4 border border-purple-100/50">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Chapter 1</h4>
                  <p className="text-sm text-gray-700">Introduction to AI-Driven Development</p>
                </div>
              </div>
            </div>

            {/* Chapter 3 */}
            <div className="bg-gradient-to-r from-purple-50 to-transparent rounded-lg p-4 border border-purple-100/50">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔮</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Chapter 3</h4>
                  <p className="text-sm text-gray-700">Mastering Vibe Coding</p>
                </div>
              </div>
            </div>

            {/* Chapter 5 */}
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