'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type UserProfile } from '@/lib/user'
import { useAdmin } from '@/contexts/AdminContext'
import { auth } from '@/lib/auth'
import InternalMobileNavigation from './InternalMobileNavigation'

interface SmartNavigationProps {
  user: UserProfile | null
  currentPage?: 'gpts' | 'documents' | 'blog' | 'dashboard'
}

export default function SmartNavigation({ user, currentPage }: SmartNavigationProps) {
  const { adminViewMode, toggleAdminView, getEffectiveUser } = useAdmin()
  const router = useRouter()
  
  // Get effective user for display (applies global admin toggle)
  const effectiveUser = getEffectiveUser(user)
  
  const handleSignOut = async () => {
    await auth.signOut()
    router.push('/')
  }

  return (
    <header className="glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={effectiveUser ? "/dashboard" : "/"} className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-slate-700 rounded-xl flex items-center justify-center shadow-lg p-1 border border-purple-500/30">
              <Image
                src="/logo.png"
                alt="thehackai logo"
                width={56}
                height={56}
                className="w-full h-full object-contain logo-dark-purple-blue-glow"
              />
            </div>
            <span className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">thehackai</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {effectiveUser ? (
              // Logged in navigation
              <>
                <nav className="flex items-center space-x-6">
                  <Link
                    href="/"
                    className="text-sm text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'dashboard' 
                        ? 'text-purple-400' 
                        : 'text-gray-300 hover:text-purple-400'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/gpts"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'gpts' 
                        ? 'text-purple-400' 
                        : 'text-gray-300 hover:text-purple-400'
                    }`}
                  >
                    GPTs
                  </Link>
                  <Link
                    href="/documents"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'documents' 
                        ? 'text-purple-400' 
                        : 'text-gray-300 hover:text-purple-400'
                    }`}
                  >
                    Playbooks
                  </Link>
                  <Link
                    href="/blog"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'blog' 
                        ? 'text-purple-400' 
                        : 'text-gray-300 hover:text-purple-400'
                    }`}
                  >
                    Blog
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  >
                    Pricing
                  </Link>
                  {user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-sm text-purple-400 hover:text-purple-700 transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  )}
                </nav>
                
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 pl-6 border-l border-gray-600">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
                    user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin'
                      ? 'bg-red-900/50 text-red-300 border border-red-500/30'
                      : effectiveUser && effectiveUser.user_tier === 'ultra'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : effectiveUser && effectiveUser.user_tier === 'pro' 
                          ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' 
                          : 'bg-gray-800/50 text-gray-300 border border-gray-600/30'
                  }`}>
                    {user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin' ? (
                      <>
                        <span>🔧</span>
                        <span>Admin</span>
                      </>
                    ) : (
                      <>
                        <span>{effectiveUser && effectiveUser.user_tier === 'ultra' ? '🚀' : effectiveUser && effectiveUser.user_tier === 'pro' ? '✨' : '🆓'}</span>
                        <span>{effectiveUser && effectiveUser.user_tier === 'ultra' ? 'Ultra' : effectiveUser && effectiveUser.user_tier === 'pro' ? 'Pro' : 'Free'}</span>
                      </>
                    )}
                  </div>
                  
                  
                  {/* Upgrade button removed - users go to /pricing page instead */}
                  
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              // Public navigation (only for blog page - other pages redirect to login)
              <>
                <nav className="flex items-center space-x-6">
                  <Link
                    href="/"
                    className="text-sm text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blog"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'blog' 
                        ? 'text-purple-400' 
                        : 'text-gray-300 hover:text-purple-400'
                    }`}
                  >
                    Blog
                  </Link>
                </nav>
                
                {/* Auth Actions */}
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-sm text-gray-300 hover:text-purple-400 transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm gradient-purple text-white px-4 py-2 rounded-full font-medium button-hover"
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          {effectiveUser ? (
            <InternalMobileNavigation 
              userEmail={effectiveUser.email}
              userTier={effectiveUser.user_tier || 'free'}
              showAdminLink={!!(user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin')}
            />
          ) : (
            // Public mobile navigation
            <div className="md:hidden">
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm text-gray-300 hover:text-purple-400 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm gradient-purple text-white px-3 py-2 rounded-full font-medium button-hover"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}