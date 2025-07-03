'use client'

import { useState } from 'react'
import Link from 'next/link'

interface InternalMobileNavigationProps {
  userEmail?: string
  isPro?: boolean
  showAdminLink?: boolean
}

export default function InternalMobileNavigation({ 
  userEmail, 
  isPro = false, 
  showAdminLink = false 
}: InternalMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const handleLinkClick = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-purple-50 transition-colors"
        aria-label="Toggle navigation menu"
      >
        <div className="flex flex-col w-5 h-5 justify-center">
          <span className={`block h-0.5 w-full bg-gray-600 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-45 translate-y-1' : ''
          }`} />
          <span className={`block h-0.5 w-full bg-gray-600 transition-all duration-300 ease-out mt-1 ${
            isOpen ? 'opacity-0' : ''
          }`} />
          <span className={`block h-0.5 w-full bg-gray-600 transition-all duration-300 ease-out mt-1 ${
            isOpen ? '-rotate-45 -translate-y-1' : ''
          }`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleLinkClick}
        />
      )}

      {/* Mobile Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out md:hidden ${
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

          {/* User Info */}
          {userEmail && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isPro 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isPro ? '✨ Pro' : '🆓 Free'}
                </div>
                <span className="text-sm text-gray-600 truncate">{userEmail}</span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-6 py-6">
            <div className="space-y-4">
              <Link
                href="/"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-gray-700 hover:text-purple-600 transition-colors py-3 border-b border-gray-100"
              >
                <span className="mr-3 text-xl">🏠</span>
                Home
              </Link>
              
              <Link
                href="/dashboard"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-gray-700 hover:text-purple-600 transition-colors py-3 border-b border-gray-100"
              >
                <span className="mr-3 text-xl">📊</span>
                Dashboard
              </Link>
              
              <Link
                href="/gpts"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-gray-700 hover:text-purple-600 transition-colors py-3 border-b border-gray-100"
              >
                <span className="mr-3 text-xl">🤖</span>
                GPTs
              </Link>
              
              <Link
                href="/documents"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-gray-700 hover:text-purple-600 transition-colors py-3 border-b border-gray-100"
              >
                <span className="mr-3 text-xl">📚</span>
                Playbooks
              </Link>
              
              <Link
                href="/blog"
                onClick={handleLinkClick}
                className="flex items-center text-lg text-gray-700 hover:text-purple-600 transition-colors py-3 border-b border-gray-100"
              >
                <span className="mr-3 text-xl">📝</span>
                Blog
              </Link>

              {showAdminLink && (
                <Link
                  href="/admin"
                  onClick={handleLinkClick}
                  className="flex items-center text-lg text-purple-600 font-medium hover:text-purple-700 transition-colors py-3 border-b border-gray-100"
                >
                  <span className="mr-3 text-xl">⚙️</span>
                  Admin Panel
                </Link>
              )}

              {!isPro && (
                <Link
                  href="/upgrade"
                  onClick={handleLinkClick}
                  className="flex items-center text-lg text-purple-600 font-medium hover:text-purple-700 transition-colors py-3 border-b border-gray-100"
                >
                  <span className="mr-3 text-xl">⭐</span>
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </nav>

          {/* Sign Out Button */}
          <div className="p-6 border-t border-gray-200">
            <form action="/auth/sign-out" method="post" className="w-full">
              <button
                type="submit"
                onClick={handleLinkClick}
                className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <span className="mr-2 text-xl">👋</span>
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}