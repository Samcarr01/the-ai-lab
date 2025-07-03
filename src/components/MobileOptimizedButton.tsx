'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface MobileOptimizedButtonProps {
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  children: ReactNode
  className?: string
  external?: boolean
}

export default function MobileOptimizedButton({ 
  href, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  external = false
}: MobileOptimizedButtonProps) {
  const baseClasses = `
    inline-flex items-center justify-center rounded-full font-semibold 
    transition-all duration-300 touch-feedback mobile-touch-target
    ${fullWidth ? 'w-full' : ''}
  `
  
  const sizeClasses = {
    small: 'px-4 sm:px-5 py-2 sm:py-2.5 text-sm',
    medium: 'px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base',
    large: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg'
  }
  
  const variantClasses = {
    primary: 'gradient-purple text-white shadow-lg hover:shadow-xl hover:scale-105',
    secondary: 'bg-white text-purple-600 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50',
    ghost: 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
  }
  
  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {children}
        </a>
      )
    }
    
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    )
  }
  
  return (
    <button onClick={onClick} className={combinedClasses}>
      {children}
    </button>
  )
}