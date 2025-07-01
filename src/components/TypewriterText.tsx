'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  texts: string[]
  className?: string
  speed?: number
  deleteSpeed?: number
  pauseTime?: number
}

export default function TypewriterText({ 
  texts, 
  className = '', 
  speed = 100, 
  deleteSpeed = 50, 
  pauseTime = 2000 
}: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const targetText = texts[currentTextIndex]
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseTime)
      return () => clearTimeout(pauseTimer)
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < targetText.length) {
          setCurrentText(targetText.substring(0, currentText.length + 1))
        } else {
          setIsPaused(true)
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.substring(0, currentText.length - 1))
        } else {
          setIsDeleting(false)
          setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length)
        }
      }
    }, isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timer)
  }, [currentText, currentTextIndex, isDeleting, isPaused, texts, speed, deleteSpeed, pauseTime])

  // Find the longest text to prevent layout shift
  const longestText = texts.reduce((a, b) => a.length > b.length ? a : b, '')
  
  // Function to highlight key words in purple
  const highlightText = (text: string) => {
    const keyWords = ['AI', 'GPT', 'playbooks']
    let highlightedText = text
    
    keyWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      highlightedText = highlightedText.replace(regex, `<span class="text-purple-600 font-semibold">${word}</span>`)
    })
    
    return highlightedText
  }
  
  return (
    <span className={`${className} inline-block relative overflow-hidden`}>
      {/* Invisible placeholder to reserve space */}
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {longestText}
      </span>
      {/* Actual content positioned absolutely */}
      <span className="absolute top-0 left-0 whitespace-nowrap">
        <span dangerouslySetInnerHTML={{ __html: highlightText(currentText) }} />
        <span className="inline-block w-1 bg-gradient-to-b from-purple-500 to-purple-600 animate-pulse ml-1 rounded-sm shadow-lg" style={{ animation: 'cursor-blink 1s infinite, cursor-glow 2s ease-in-out infinite alternate' }}>
          &nbsp;
        </span>
      </span>
    </span>
  )
}