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
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg animate-pulse p-2">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
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
                { action: handleFeatureClick, icon: '✨', label: 'Features', delay: 'delay-200', type: 'button' as const },
                { action: handlePricingClick, icon: '💜', label: 'Pricing', delay: 'delay-300', type: 'button' as const },
                { href: '/blog', icon: '📝', label: 'Blog', delay: 'delay-400', type: 'link' as const },
                { href: '/login', icon: '👋', label: 'Sign In', delay: 'delay-500', type: 'link' as const, special: true }
              ].map((item, index) => (
                item.type === 'button' ? (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`group flex items-center text-lg py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-sm active:scale-95 w-full text-left ${
                      item.special
                        ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                        : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                    } ${animateItems ? `translate-x-0 opacity-100 ${item.delay}` : 'translate-x-8 opacity-0'}`}
                  >
                    <span className={`mr-4 text-2xl transition-transform duration-200 group-hover:scale-110`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={handleLinkClick}
                    className={`group flex items-center text-lg py-4 px-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-sm active:scale-95 ${
                      isActivePage(item.href!)
                        ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500 font-medium shadow-sm'
                        : item.special
                          ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                          : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                    } ${animateItems ? `translate-x-0 opacity-100 ${item.delay}` : 'translate-x-8 opacity-0'}`}
                  >
                    <span className={`mr-4 text-2xl transition-transform duration-200 ${
                      isActivePage(item.href!) ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {isActivePage(item.href!) && (
                      <div className="ml-auto w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    )}
                  </Link>
                )
              ))}
            </div>
          </nav>

          {/* CTA Button */}
          <div className={`p-6 border-t border-gray-200 bg-gray-50 transition-all duration-500 delay-600 ${
            animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}>
            <Link
              href="/signup"
              onClick={handleLinkClick}
              className="group flex items-center justify-center w-full gradient-purple text-white py-4 px-6 rounded-xl font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span className="mr-3 text-xl transition-transform duration-200 group-hover:scale-110">🚀</span>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}