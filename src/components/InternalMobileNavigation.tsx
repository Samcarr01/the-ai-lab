'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface InternalMobileNavigationProps {
  userEmail?: string
  userTier?: 'free' | 'pro' | 'ultra'
  showAdminLink?: boolean
  showSignOut?: boolean
}

export default function InternalMobileNavigation({ 
  userEmail, 
  userTier = 'free', 
  showAdminLink = false,
  showSignOut = true
}: InternalMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [animateItems, setAnimateItems] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      // Start item animations after menu opens
      setTimeout(() => setAnimateItems(true), 100)
    } else {
      setAnimateItems(false)
    }
  }
  
  const handleLinkClick = () => {
    setAnimateItems(false)
    setTimeout(() => setIsOpen(false), 150)
  }

  // Close menu on route change
  useEffect(() => {
    setAnimateItems(false)
    setIsOpen(false)
  }, [pathname])

  const isActivePage = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden flex items-center justify-center w-12 h-12 rounded-xl hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
        aria-label="Toggle navigation menu"
      >
        <div className="flex flex-col w-6 h-6 justify-center">
          <span className={`block h-0.5 w-full bg-gray-600 transition-all duration-300 ease-out ${
            isOpen ? 'rotate-45 translate-y-1.5 bg-purple-600' : ''
          }`} />
          <span className={`block h-0.5 w-full bg-gray-600 transition-all duration-300 ease-out mt-1.5 ${
            isOpen ? 'opacity-0 scale-0' : ''
          }`} />
          <span className={`block h-0.5 w-full bg-gray-600 transition-all duration-300 ease-out mt-1.5 ${
            isOpen ? '-rotate-45 -translate-y-1.5 bg-purple-600' : ''
          }`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-black z-40 md:hidden transition-all duration-300 ease-out ${
        isOpen ? 'bg-opacity-50 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'
      }`} onClick={handleLinkClick} />

      {/* Mobile Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-72 sm:w-80 bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out md:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b border-gray-200 transition-all duration-500 ${
            animateItems ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg animate-pulse p-1 border border-purple-200">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain logo-dark-purple-blue-glow"
                />
              </div>
              <span className="text-xl font-bold text-gradient">thehackai</span>
            </div>
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Close menu"
            >
              <span className="text-xl text-gray-600">✕</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-6 py-6">
            <div className="space-y-2">
              {[
                { href: '/', icon: '🏠', label: 'Home', delay: 'delay-200' },
                { href: '/dashboard', icon: '📊', label: 'Dashboard', delay: 'delay-300' },
                { href: '/gpts', icon: 'logo', label: 'GPTs', delay: 'delay-400' },
                { href: '/documents', icon: '📚', label: 'Playbooks', delay: 'delay-500' },
                { href: '/blog', icon: '📝', label: 'Blog', delay: 'delay-600' }
              ].map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`group flex items-center text-lg py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-sm active:scale-95 ${
                    isActivePage(item.href)
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500 font-medium shadow-sm'
                      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  } ${animateItems ? `translate-x-0 opacity-100 ${item.delay}` : 'translate-x-8 opacity-0'}`}
                >
                  <span className={`mr-4 text-2xl transition-transform duration-200 ${
                    isActivePage(item.href) ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    {item.icon === 'logo' ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Image
                          src="/logo.png"
                          alt="GPTs"
                          width={24}
                          height={24}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      item.icon
                    )}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {isActivePage(item.href) && (
                    <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}

              {showAdminLink && (
                <Link
                  href="/admin"
                  onClick={handleLinkClick}
                  className={`group flex items-center text-lg py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-sm active:scale-95 ${
                    isActivePage('/admin')
                      ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600 font-medium shadow-sm'
                      : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                  } ${animateItems ? 'translate-x-0 opacity-100 delay-700' : 'translate-x-8 opacity-0'}`}
                >
                  <span className={`mr-4 text-2xl transition-transform duration-200 ${
                    isActivePage('/admin') ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    ⚙️
                  </span>
                  <span className="font-medium">Admin Panel</span>
                  {isActivePage('/admin') && (
                    <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              )}

              {userTier !== 'ultra' && (
                <Link
                  href="/upgrade"
                  onClick={handleLinkClick}
                  className={`group flex items-center text-lg py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-sm active:scale-95 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 ${
                    isActivePage('/upgrade')
                      ? 'text-purple-700 font-medium shadow-md'
                      : 'text-purple-600 hover:text-purple-700 hover:shadow-md'
                  } ${animateItems ? 'translate-x-0 opacity-100 delay-800' : 'translate-x-8 opacity-0'}`}
                >
                  <span className={`mr-4 text-2xl transition-transform duration-200 ${
                    isActivePage('/upgrade') ? 'scale-110' : 'group-hover:scale-110'
                  }`}>
                    ⭐
                  </span>
                  <span className="font-medium">{userTier === 'pro' ? 'Upgrade to Ultra' : 'Upgrade'}</span>
                  {isActivePage('/upgrade') && (
                    <div className="ml-auto w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  )}
                </Link>
              )}
            </div>
          </nav>

          {/* User Info Section - Moved to Bottom */}
          {userEmail && (
            <div className={`px-6 py-6 border-t border-gray-200 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 transition-all duration-500 delay-800 ${
              animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <div className="flex flex-col space-y-3">
                {/* Premium Badge */}
                <div className={`self-start px-5 py-3 rounded-2xl text-base font-bold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  userTier === 'ultra'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-purple-300 shadow-purple-200' 
                    : userTier === 'pro' 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-2 border-purple-300 shadow-purple-200' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-300 shadow-blue-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{userTier === 'ultra' ? '🚀' : userTier === 'pro' ? '✨' : '🆓'}</span>
                    <span className="tracking-wide">{userTier === 'ultra' ? 'ULTRA MEMBER' : userTier === 'pro' ? 'PRO MEMBER' : 'FREE ACCOUNT'}</span>
                  </div>
                </div>
                
                {/* Email Display */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium truncate max-w-[200px]" title={userEmail}>
                      {userEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          {showSignOut && (
            <div className={`p-6 border-t border-gray-200 bg-gray-50 transition-all duration-500 delay-900 ${
              animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <button
                onClick={async () => {
                  try {
                    handleLinkClick()
                    // Use proper auth signOut method
                    const { auth } = await import('@/lib/auth')
                    await auth.signOut()
                    window.location.href = '/'
                  } catch (error) {
                    console.error('Sign out error:', error)
                    window.location.href = '/'
                  }
                }}
                className="group flex items-center justify-center w-full text-gray-600 hover:text-red-600 py-4 px-4 rounded-xl hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
              >
                <span className="mr-3 text-xl transition-transform duration-200 group-hover:scale-110">👋</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}