'use client'

import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  texts: string[]
  className?: string
  speed?: number
  deleteSpeed?: number
  pauseTime?: number
  playOnce?: boolean
}

export default function TypewriterText({ 
  texts, 
  className = '', 
  speed = 100, 
  deleteSpeed = 50, 
  pauseTime = 2000,
  playOnce = false
}: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  // Function to create highlighted text during typing
  const createHighlightedText = (text: string, fullText: string) => {
    const keyWords = ['AI', 'GPT', 'playbooks']
    
    // Find all keyword positions in the full text
    const keywordPositions: Array<{start: number, end: number, word: string}> = []
    
    keyWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      let match
      while ((match = regex.exec(fullText)) !== null) {
        keywordPositions.push({
          start: match.index,
          end: match.index + word.length,
          word: word
        })
      }
    })
    
    // Sort by position
    keywordPositions.sort((a, b) => a.start - b.start)
    
    // Build the highlighted text character by character
    let result = ''
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      // Check if this character is part of a keyword
      const isInKeyword = keywordPositions.some(kw => i >= kw.start && i < kw.end)
      
      if (isInKeyword) {
        // Check if this is the start of a keyword
        const keywordStart = keywordPositions.find(kw => i === kw.start)
        if (keywordStart) {
          result += `<span class="text-purple-600 font-semibold">${char}`
        } else {
          result += char
        }
        
        // Check if this is the end of a keyword
        const keywordEnd = keywordPositions.find(kw => i === kw.end - 1)
        if (keywordEnd) {
          result += '</span>'
        }
      } else {
        result += char
      }
    }
    
    return result
  }

  useEffect(() => {
    if (hasCompleted && playOnce) return // Stop if completed and playOnce is true
    
    const targetText = texts[currentTextIndex]
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false)
        if (playOnce) {
          // For play once mode, stop after first text
          setHasCompleted(true)
          return
        } else {
          setIsDeleting(true)
        }
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
          const nextIndex = (currentTextIndex + 1) % texts.length
          setCurrentTextIndex(nextIndex)
          
          // If we've cycled through all texts once in playOnce mode, stop
          if (playOnce && nextIndex === 0) {
            setHasCompleted(true)
            setCurrentTextIndex(0)
            setCurrentText(texts[0]) // Show first text
          }
        }
      }
    }, isDeleting ? deleteSpeed : speed)

    return () => clearTimeout(timer)
  }, [currentText, currentTextIndex, isDeleting, isPaused, texts, speed, deleteSpeed, pauseTime, playOnce, hasCompleted])

  // Find the longest text to prevent layout shift
  const longestText = texts.reduce((a, b) => a.length > b.length ? a : b, '')
  const fullTargetText = texts[currentTextIndex]
  const highlightedText = createHighlightedText(currentText, fullTargetText)
  
  return (
    <span className={`${className} inline-block`}>
      <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
      <span className="inline-block w-1 bg-gradient-to-b from-purple-500 to-purple-600 ml-1 rounded-sm shadow-lg" style={{ animation: 'cursor-blink 1s infinite, cursor-glow 2s ease-in-out infinite alternate' }}>
        &nbsp;
      </span>
    </span>
  )
}