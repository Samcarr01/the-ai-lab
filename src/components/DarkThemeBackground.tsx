import React from 'react'

interface DarkThemeBackgroundProps {
  children: React.ReactNode
  className?: string
}

export default function DarkThemeBackground({ children, className = "" }: DarkThemeBackgroundProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 relative overflow-hidden ${className}`}>
      {/* Global Purple/Pink Corner Glows - Mobile Optimized */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-24 sm:w-40 md:w-56 lg:w-64 h-24 sm:h-40 md:h-56 lg:h-64 bg-gradient-to-br from-purple-500/15 sm:from-purple-500/18 md:from-purple-500/20 to-transparent rounded-full blur-2xl sm:blur-3xl will-change-transform"></div>
        <div className="absolute top-0 right-0 w-28 sm:w-48 md:w-68 lg:w-80 h-28 sm:h-48 md:h-68 lg:h-80 bg-gradient-to-bl from-pink-500/12 sm:from-pink-500/14 md:from-pink-500/15 to-transparent rounded-full blur-2xl sm:blur-3xl will-change-transform"></div>
        <div className="absolute bottom-0 left-0 w-26 sm:w-44 md:w-60 lg:w-72 h-26 sm:h-44 md:h-60 lg:h-72 bg-gradient-to-tr from-purple-400/12 sm:from-purple-400/14 md:from-purple-400/15 to-transparent rounded-full blur-2xl sm:blur-3xl will-change-transform"></div>
        <div className="absolute bottom-0 right-0 w-24 sm:w-40 md:w-56 lg:w-64 h-24 sm:h-40 md:h-56 lg:h-64 bg-gradient-to-tl from-pink-400/15 sm:from-pink-400/18 md:from-pink-400/20 to-transparent rounded-full blur-2xl sm:blur-3xl will-change-transform"></div>
        
        {/* Global Mesh Pattern Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/6 sm:from-purple-900/7 md:from-purple-900/8 via-transparent to-pink-900/6 sm:to-pink-900/7 md:to-pink-900/8"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}