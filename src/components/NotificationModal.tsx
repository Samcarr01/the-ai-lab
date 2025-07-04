'use client'

import { useEffect } from 'react'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
}

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success' 
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto-close after 3 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: '✅',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: '❌',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={`
          bg-white rounded-2xl shadow-2xl border-2 ${styles.border} 
          max-w-sm w-full mx-auto transform transition-all duration-300 
          animate-in slide-in-from-bottom-4
        `}>
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`
                flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-full 
                flex items-center justify-center
              `}>
                <span className="text-2xl">{styles.icon}</span>
              </div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold ${styles.titleColor} mb-1`}>
                  {title}
                </h3>
                <p className={`text-sm ${styles.messageColor} leading-relaxed`}>
                  {message}
                </p>
              </div>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Action Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="gradient-purple text-white px-6 py-2 rounded-xl font-medium text-sm hover:scale-105 transform transition-all duration-200 shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}