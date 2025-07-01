'use client'

import { useState } from 'react'
import Link from 'next/link'

interface MobileNavigationProps {
  onFeatureClick: () => void
  onPricingClick: () => void
}

export default function MobileNavigation({ onFeatureClick, onPricingClick }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  
  const handleLinkClick = () => setIsOpen(false)

  const handleFeatureClick = () => {
    onFeatureClick()
    setIsOpen(false)
  }

  const handlePricingClick = () => {
    onPricingClick()
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden flex items-center justify-center w-12 h-12 rounded-lg hover:bg-purple-50 transition-colors z-[80] relative"
        aria-label="Toggle navigation menu"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="flex flex-col w-6 h-6 justify-center">
          <span className={`block h-0.5 w-full bg-gray-700 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-45 translate-y-1.5' : ''
          }`} />
          <span className={`block h-0.5 w-full bg-gray-700 transition-all duration-300 ease-out mt-1.5 ${
            isOpen ? 'opacity-0' : ''
          }`} />
          <span className={`block h-0.5 w-full bg-gray-700 transition-all duration-300 ease-out mt-1.5 ${
            isOpen ? '-rotate-45 -translate-y-1.5' : ''
          }`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] md:hidden"
          onClick={handleLinkClick}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-out md:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-purple rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🧪</span>
              </div>
              <span className="text-xl font-bold text-gradient">The AI Lab</span>
            </div>
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <span className="text-2xl text-gray-600">×</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-6 py-6">
            <div className="space-y-2">
              <button
                onClick={handleFeatureClick}
                className="flex items-center w-full text-left text-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all py-4 px-4 rounded-lg"
              >
                <span className="mr-3 text-xl">✨</span>
                Features
              </button>
              
              <button
                onClick={handlePricingClick}
                className="flex items-center w-full text-left text-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all py-4 px-4 rounded-lg"
              >
                <span className="mr-3 text-xl">💜</span>
                Pricing
              </button>
              
              <Link
                href="/blog"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all py-4 px-4 rounded-lg"
              >
                <span className="mr-3 text-xl">📝</span>
                Blog
              </Link>
              
              <Link
                href="/login"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-purple-600 font-medium hover:text-purple-700 hover:bg-purple-50 transition-all py-4 px-4 rounded-lg"
              >
                <span className="mr-3 text-xl">👋</span>
                Sign In
              </Link>
            </div>
          </nav>

          {/* CTA Button */}
          <div className="p-6 border-t border-gray-200">
            <Link
              href="/signup"
              onClick={handleLinkClick}
              className="flex items-center justify-center w-full gradient-purple text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span className="mr-2 text-xl">🚀</span>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}