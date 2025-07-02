'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import InternalMobileNavigation from '@/components/InternalMobileNavigation'
import GradientBackground from '@/components/NetworkBackground'
import { gptsService } from '@/lib/gpts'
import { documentsService } from '@/lib/documents'

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const [stats, setStats] = useState({ gpts: 0, documents: 0, blogPosts: 0 })
  const router = useRouter()

  // Helper function to extract a proper name from email
  const extractNameFromEmail = (email: string): string => {
    const username = email.split('@')[0]
    
    // Remove common number patterns from the end
    const withoutNumbers = username.replace(/\d+$/, '')
    
    // Try to split on common patterns
    let parts: string[] = []
    
    // Check for common separators first
    if (withoutNumbers.includes('.')) {
      parts = withoutNumbers.split('.')
    } else if (withoutNumbers.includes('_')) {
      parts = withoutNumbers.split('_')
    } else if (withoutNumbers.includes('-')) {
      parts = withoutNumbers.split('-')
    } else {
      // Try to intelligently split camelCase or common name patterns
      // For "samcarr" -> try to detect "sam" + "carr"
      const commonFirstNames = ['sam', 'john', 'jane', 'mike', 'chris', 'alex', 'david', 'sarah', 'emma', 'james']
      
      for (const firstName of commonFirstNames) {
        if (withoutNumbers.toLowerCase().startsWith(firstName)) {
          const remaining = withoutNumbers.slice(firstName.length)
          if (remaining.length > 0) {
            parts = [firstName, remaining]
            break
          }
        }
      }
      
      // If no pattern found, just use the whole username
      if (parts.length === 0) {
        parts = [withoutNumbers]
      }
    }
    
    // Capitalize each part
    const capitalizedParts = parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    
    // Return the formatted name or fall back to username
    return capitalizedParts.length > 1 ? capitalizedParts.join(' ') : capitalizedParts[0] || username
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const { user: authUser, error } = await auth.getUser()
        
        if (error || !authUser) {
          router.push('/login')
          return
        }

        // Fetch user profile from our database
        let userProfile = await userService.getProfile(authUser.id)
        
        // If no profile exists, create one (for existing auth users)
        if (!userProfile) {
          userProfile = await userService.createProfile(authUser.id, authUser.email || '')
        }
        
        if (userProfile) {
          setUser(userProfile)
          
          // Load live stats
          await loadStats()
        } else {
          console.error('Failed to load or create user profile')
          router.push('/login')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    const loadStats = async () => {
      try {
        const [gptsData, documentsData] = await Promise.all([
          gptsService.getAllGPTs(),
          documentsService.getAllDocuments()
        ])
        
        setStats({
          gpts: gptsData.length,
          documents: documentsData.length,
          blogPosts: 0 // Will be updated when blog is implemented
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    getUser()
  }, [router])

  // Check for upgrade success parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('upgrade') === 'success') {
      setShowUpgradeSuccess(true)
      // Clear the URL parameter after showing success
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setShowUpgradeSuccess(false)
      }, 10000)
    }
  }, [])

  const handleSignOut = async () => {
    await auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white relative">
      {/* Animated Background */}
      <GradientBackground />
      
      {/* Header */}
      <header className="glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🧪</span>
              </div>
              <span className="text-xl font-semibold text-gradient">The AI Lab</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex items-center space-x-6">
                <Link
                  href="/blog"
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                >
                  Blog
                </Link>
                {user.email === 'samcarr1232@gmail.com' && (
                  <Link
                    href="/admin"
                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
              </nav>
              
              {/* User Profile Section */}
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
                  user.email === 'samcarr1232@gmail.com'
                    ? 'bg-red-100 text-red-700'
                    : user.is_pro 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.email === 'samcarr1232@gmail.com' ? (
                    <>
                      <span>🔧</span>
                      <span>Admin</span>
                    </>
                  ) : (
                    <>
                      <span>{user.is_pro ? '✨' : '🆓'}</span>
                      <span>{user.is_pro ? 'Pro' : 'Free'}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <InternalMobileNavigation 
              userEmail={user.email}
              isPro={user.is_pro}
              showAdminLink={user.email === 'samcarr1232@gmail.com'}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upgrade Success Message */}
        {showUpgradeSuccess && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Welcome to Pro!</h3>
                  <p className="text-sm text-green-600">
                    Your upgrade was successful! You now have full access to all GPTs and PDF guides.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeSuccess(false)}
                className="text-green-600 hover:text-green-800 text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/30 rounded-3xl p-8 border border-purple-100/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 gradient-purple rounded-2xl flex items-center justify-center shadow-lg animate-float">
                  <span className="text-2xl">👋</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Welcome back, {extractNameFromEmail(user.email)}!
                  </h1>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.email === 'samcarr1232@gmail.com'
                        ? 'bg-red-100 text-red-700'
                        : user.is_pro 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.email === 'samcarr1232@gmail.com' ? '🔧 Admin' : user.is_pro ? '✨ Pro Member' : '🆓 Free Member'}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed">
                {user.is_pro || user.email === 'samcarr1232@gmail.com'
                  ? "You have full access to my personal collection of GPTs and playbooks. Upload the PDFs directly to ChatGPT, Claude, or any LLM as knowledge."
                  : "Start exploring my AI collection. Upgrade anytime for full access to download PDFs and unlock all GPTs!"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!user.is_pro && (
          <div className="mb-8 gradient-purple rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-xl font-semibold mb-2">Unlock Everything with Pro! ⚡</h3>
                <p className="text-purple-100">
                  Get direct access to all 7 GPTs and download PDF playbooks you can upload to ChatGPT, Claude, or any LLM as knowledge.
                </p>
              </div>
              <Link
                href="/upgrade"
                className="bg-white text-purple-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg sm:whitespace-nowrap w-full sm:w-auto text-center"
              >
                Upgrade for £15/month 🚀
              </Link>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">GPTs Available</p>
                <p className="text-4xl font-bold text-purple-600">{stats.gpts}</p>
                <p className="text-xs text-gray-500 mt-1">Ready to explore</p>
              </div>
              <div className="w-16 h-16 gradient-purple rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🤖</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Playbooks</p>
                <p className="text-4xl font-bold text-purple-600">{stats.documents}</p>
                <p className="text-xs text-gray-500 mt-1">PDF guides available</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Blog Posts</p>
                <p className="text-4xl font-bold text-purple-600">{stats.blogPosts}</p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📝</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* GPTs Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-purple-100/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-purple-subtle rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">AI GPTs</h3>
                  <p className="text-sm text-gray-600">
                    {user.is_pro ? 'Direct access to all GPTs' : 'Preview available • Upgrade for full access'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💼</span>
                  <span className="font-medium text-gray-900">Business Planning</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">✅ Access</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium text-gray-900">Productivity</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">✅ Access</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🗣️</span>
                  <span className="font-medium text-gray-900">Communication</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">✅ Access</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-gray-900">Automation</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">✅ Access</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
            </div>

            <Link
              href="/gpts"
              className="w-full block text-center gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
            >
              Browse All GPTs →
            </Link>
          </div>

          {/* Playbooks Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-purple-100/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-purple-subtle rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">AI Playbooks</h3>
                  <p className="text-sm text-gray-600">
                    {user.is_pro ? 'Download PDFs for ChatGPT/Claude knowledge' : 'Preview available • Upgrade to download'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💼</span>
                  <span className="font-medium text-gray-900">Business Strategy</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">📥 Download</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium text-gray-900">Productivity Systems</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">📥 Download</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-medium text-gray-900">Marketing & Content</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">📥 Download</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-gray-900">AI Workflows</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">📥 Download</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
            </div>

            <Link
              href="/documents"
              className="w-full block text-center gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
            >
              Browse All Playbooks →
            </Link>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">How to Use Your Playbooks</h3>
                <p className="text-sm text-green-600">Step-by-step instructions 📚</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <span>🤖</span>
                <span>For ChatGPT</span>
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Download PDFs → Upload to ChatGPT → Select "Create GPT" → Upload as knowledge files → Start chatting with enhanced AI
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <span>🧠</span>
                <span>For Claude</span>
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Download PDFs → Start new conversation → Upload files → Claude will reference them in responses → Enhanced AI assistance
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <span>⚡</span>
              <span>Pro Tip</span>
            </h4>
            <p className="text-sm text-gray-600">
              Upload multiple playbooks together for comprehensive AI knowledge. Each PDF contains battle-tested workflows and strategies that enhance your AI assistant's capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}