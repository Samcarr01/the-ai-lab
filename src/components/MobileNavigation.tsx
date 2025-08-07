'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

interface MobileNavigationProps {
  onFeatureClick: () => void
  onPricingClick: () => void
}

export default function MobileNavigation({ onFeatureClick, onPricingClick }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }
  
  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const handleFeatureClick = () => {
    onFeatureClick()
    handleLinkClick()
  }

  const handlePricingClick = () => {
    onPricingClick()
    handleLinkClick()
  }

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent scrolling when modal is open (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
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
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset'
        document.body.style.position = 'unset'
        document.body.style.width = 'unset'
      }
    }
  }, [isOpen])

  const isActivePage = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  const menuItems = [
    { href: '/solutions', icon: '🎯', label: 'Solutions', type: 'link' as const },
    { action: handleFeatureClick, icon: '⚡', label: 'Features', type: 'button' as const },
    { action: handlePricingClick, icon: '💰', label: 'Pricing', type: 'button' as const },
    { href: '/toolkit', icon: '🛠️', label: 'Our Toolkit', type: 'link' as const },
    { href: '/blog', icon: '✍️', label: 'Blogs', type: 'link' as const },
    { href: '/login', icon: '🔑', label: 'Sign In', type: 'link' as const },
    { href: '/signup', icon: '🚀', label: 'Get Started', type: 'link' as const, special: true }
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
        {/* Menu Items */}
        <div className="p-3">
          {menuItems.map((item, index) => {
            const isActive = item.type === 'link' && isActivePage(item.href!)
            
            if (item.type === 'button') {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center space-x-3 px-3 py-3 mb-1 rounded-lg text-white hover:bg-white/10 transition-all duration-150 hover:scale-105 active:scale-95 w-full text-left"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={handleLinkClick}
                className={`flex items-center space-x-3 px-3 py-3 mb-1 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 ${
                  item.special
                    ? 'bg-purple-600/20 text-purple-200'
                    : isActive 
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
      </div>
    </>
  )
}