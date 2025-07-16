'use client'

import { useEffect } from 'react'

interface DescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  category: string
  categoryIcon: string
  type: 'gpt' | 'playbook'
}

export default function DescriptionModal({
  isOpen,
  onClose,
  title,
  description,
  category,
  categoryIcon,
  type
}: DescriptionModalProps) {
  // Close modal on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-8 pb-6 border-b border-gray-100">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-16 h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">{categoryIcon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {title}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  {category}
                </span>
                <span className="text-sm text-gray-500">
                  {type === 'gpt' ? 'GPT' : 'Playbook'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0 ml-4"
            aria-label="Close modal"
          >
            <svg 
              className="w-6 h-6 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
          
          {/* Usage Tips Section */}
          <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xl">💡</span>
              <h3 className="text-lg font-semibold text-purple-900">
                {type === 'gpt' ? 'Usage Tips' : 'Implementation Tips'}
              </h3>
            </div>
            <p className="text-purple-700 text-sm leading-relaxed">
              {type === 'gpt' 
                ? "Click the GPT link to open it directly in ChatGPT. Start with a clear, specific prompt to get the best results. You can reference previous conversations and build upon them for complex tasks."
                : "Download the PDF and upload it to any LLM (ChatGPT, Claude, Gemini, etc.) as knowledge. The playbook contains step-by-step instructions, templates, and real-world examples you can adapt to your needs."
              }
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {type === 'gpt' ? 'Ready to use in ChatGPT' : 'Ready for AI knowledge upload'}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 gradient-purple text-white rounded-xl font-medium hover:scale-105 transform transition-all duration-200"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}