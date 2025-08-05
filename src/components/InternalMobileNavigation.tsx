'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { type UserProfile, getUserDisplayName } from '@/lib/user'

interface InternalMobileNavigationProps {
  user?: UserProfile | null
  userEmail?: string // Keep for backward compatibility
  userTier?: 'free' | 'pro' | 'ultra' // Keep for backward compatibility
  showAdminLink?: boolean
}

export default function InternalMobileNavigation({ 
  user,
  userEmail, 
  userTier = 'free', 
  showAdminLink = false
}: InternalMobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }
  
  const handleLinkClick = () => {
    setIsOpen(false)
  }

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
      document.body.style.position = 'unset'
      document.body.style.width = 'unset'
    }
  }, [isOpen])

  const isActivePage = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  // Use the new display name function if we have user profile, fall back to email-based for backward compatibility
  const displayName = user ? getUserDisplayName(user) : (userEmail ? userEmail.split('@')[0] : 'User')

  const menuItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/solutions', icon: '🎯', label: 'Solutions' },
    { href: '/gpts', icon: '🤖', label: 'GPTs' },
    { href: '/documents', icon: '📚', label: 'Playbooks' },
    { href: '/blog', icon: '✍️', label: 'Blogs' },
    { href: '/settings', icon: '⚙️', label: 'Settings' }
  ]

  return (
    <>
      {/* 🔥 EPIC MORPHING FLOATING ACTION BUTTON */}
      <button
        onClick={toggleMenu}
        className={`w-12 h-12 rounded-full transform hover:scale-110 active:scale-95 z-[100] morph-circle ${
          isOpen ? 'open morph-pulse' : ''
        } ${
          isOpen 
            ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-500/50' 
            : 'bg-gradient-to-br from-purple-600 to-purple-700 shadow-xl shadow-purple-500/40'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          overflow: 'visible'
        }}
        aria-label="Toggle Menu"
        aria-expanded={isOpen}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 🌟 EPIC MORPHING HAMBURGER LINES */}
          <div className="relative w-5 h-4 flex flex-col justify-center items-center">
            {/* Top line */}
            <div className={`absolute w-4 h-0.5 bg-white rounded-full hamburger-line hamburger-line-1 ${isOpen ? 'open' : ''}`} style={{ top: '2px' }}></div>
            {/* Middle line */}
            <div className={`absolute w-4 h-0.5 bg-white rounded-full hamburger-line hamburger-line-2 ${isOpen ? 'open' : ''}`} style={{ top: '7px' }}></div>
            {/* Bottom line */}
            <div className={`absolute w-4 h-0.5 bg-white rounded-full hamburger-line hamburger-line-3 ${isOpen ? 'open' : ''}`} style={{ top: '12px' }}></div>
          </div>
        </div>
      </button>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 transition-opacity duration-300 md:hidden z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleLinkClick}
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* DROPDOWN MENU */}
      <div 
        className={`md:hidden absolute top-16 right-0 w-52 transition-all duration-200 ease-out z-50 ${
          isOpen 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
        }`}
        style={{
          background: 'rgba(20, 20, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Main Menu Items */}
        <div className="p-3">
          {menuItems.map((item, index) => {
            const isActive = isActivePage(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-3 mb-1 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/10"></div>

        {/* Secondary Actions */}
        <div className="p-3 space-y-1">
          {showAdminLink && (
            <Link
              href="/admin"
              onClick={handleLinkClick}
              className="flex items-center space-x-3 px-3 py-3 rounded-lg text-orange-300 hover:bg-orange-500/10 transition-all duration-150 hover:scale-105 active:scale-95"
            >
              <span className="text-lg">🔧</span>
              <span className="text-sm font-medium">Admin</span>
            </Link>
          )}
          
          <button
            onClick={async () => {
              try {
                handleLinkClick()
                localStorage.removeItem('supabase-auth-persist')
                localStorage.removeItem('rememberMe')
                const { auth } = await import('@/lib/auth')
                await auth.signOut()
                window.location.href = '/'
              } catch (error) {
                console.error('Sign out error:', error)
                window.location.href = '/'
              }
            }}
            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-red-300 hover:bg-red-500/10 transition-all duration-150 hover:scale-105 active:scale-95 w-full text-left"
          >
            <span className="text-lg">👋</span>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* USER INFO */}
      <div 
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl transition-all duration-300 md:hidden z-50 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        style={{
          background: 'rgba(20, 20, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-white font-medium text-sm">
              {displayName}
            </div>
            <div className="text-xs text-gray-300 flex items-center space-x-1">
              <span>{userTier === 'pro' ? '✨' : '🆓'}</span>
              <span>{userTier === 'pro' ? 'Pro' : 'Free'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}