'use client'

import Link from 'next/link'
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
    <header className="glass border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={effectiveUser ? "/dashboard" : "/"} className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🧪</span>
            </div>
            <span className="text-xl font-semibold text-gradient">The AI Lab</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {effectiveUser ? (
              // Logged in navigation
              <>
                <nav className="flex items-center space-x-6">
                  <Link
                    href="/dashboard"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'dashboard' 
                        ? 'text-purple-600' 
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/gpts"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'gpts' 
                        ? 'text-purple-600' 
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    GPTs
                  </Link>
                  <Link
                    href="/documents"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'documents' 
                        ? 'text-purple-600' 
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    Playbooks
                  </Link>
                  <Link
                    href="/blog"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'blog' 
                        ? 'text-purple-600' 
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    Blog
                  </Link>
                  {user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      Admin
                    </Link>
                  )}
                </nav>
                
                {/* User Profile Section */}
                <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
                    user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : effectiveUser && effectiveUser.is_pro 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin' ? (
                      <>
                        <span>🔧</span>
                        <span>Admin</span>
                      </>
                    ) : (
                      <>
                        <span>{effectiveUser && effectiveUser.is_pro ? '✨' : '🆓'}</span>
                        <span>{effectiveUser && effectiveUser.is_pro ? 'Pro' : 'Free'}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Admin Toggle Button (only for admin) */}
                  {user && user.email === 'samcarr1232@gmail.com' && (
                    <button
                      onClick={toggleAdminView}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                        adminViewMode === 'admin' 
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                      title={`Currently viewing as: ${adminViewMode === 'admin' ? 'Admin' : 'Free User'}`}
                    >
                      {adminViewMode === 'admin' ? '👤 View as Free' : '🔧 View as Admin'}
                    </button>
                  )}
                  
                  {effectiveUser && !effectiveUser.is_pro && effectiveUser.email !== 'samcarr1232@gmail.com' && (
                    <Link
                      href="/upgrade"
                      className="text-sm gradient-purple text-white px-4 py-2 rounded-full font-medium button-hover"
                    >
                      Upgrade
                    </Link>
                  )}
                  
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
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
                    className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blog"
                    className={`text-sm transition-colors font-medium ${
                      currentPage === 'blog' 
                        ? 'text-purple-600' 
                        : 'text-gray-600 hover:text-purple-600'
                    }`}
                  >
                    Blog
                  </Link>
                </nav>
                
                {/* Auth Actions */}
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
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
              isPro={effectiveUser.is_pro}
              showAdminLink={!!(user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin')}
            />
          ) : (
            // Public mobile navigation
            <div className="md:hidden">
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
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