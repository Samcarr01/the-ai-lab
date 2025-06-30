'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const router = useRouter()

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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
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
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.is_pro 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.is_pro ? '✨ Pro Member' : '🆓 Free Member'}
                </div>
                {user.email === 'samcarr1232@gmail.com' && (
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    🔧 Admin
                  </div>
                )}
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center space-x-4">
                {user.email === 'samcarr1232@gmail.com' && (
                  <Link
                    href="/admin"
                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-xl text-gray-600">
            {user.is_pro 
              ? "You have full access to my personal collection of GPTs and playbooks. Upload the PDFs directly to ChatGPT, Claude, or any LLM as knowledge."
              : "Start exploring my AI collection. Upgrade anytime for full access!"
            }
          </p>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!user.is_pro && (
          <div className="mb-8 gradient-purple rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Unlock Everything with Pro! ⚡</h3>
                <p className="text-purple-100">
                  Get direct access to all 7 GPTs and download PDF playbooks you can upload to ChatGPT, Claude, or any LLM as knowledge.
                </p>
              </div>
              <Link
                href="/upgrade"
                className="bg-white text-purple-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                Upgrade for £15/month 🚀
              </Link>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">GPTs Available</p>
                <p className="text-3xl font-bold text-purple-600">7</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Playbooks</p>
                <p className="text-3xl font-bold text-purple-600">Growing</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blog Posts</p>
                <p className="text-3xl font-bold text-purple-600">Soon</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* GPTs Section */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100">
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
                  <span className="text-lg">💡</span>
                  <span className="font-medium text-gray-900">Content Strategy GPT</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">✅ Access</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-medium text-gray-900">Marketing Automation</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">✅ Access</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📊</span>
                  <span className="font-medium text-gray-900">Data Analysis Pro</span>
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
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-100">
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
                  <span className="text-lg">⚡</span>
                  <span className="font-medium text-gray-900">AI Workflow Mastery</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">📥 Download</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎨</span>
                  <span className="font-medium text-gray-900">Design with AI</span>
                </div>
                {user.is_pro ? (
                  <span className="text-green-600 text-sm">📥 Download</span>
                ) : (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🚀</span>
                  <span className="font-medium text-gray-900">Productivity Hacks</span>
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

        {/* Blog Section */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg border border-green-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Latest Blog Posts</h3>
                <p className="text-sm text-green-600">Free for everyone! 🎉</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2">The Future of AI Workflows</h4>
              <p className="text-sm text-gray-600 mb-3">
                Discover how AI is revolutionizing productivity and what's coming next...
              </p>
              <span className="text-xs text-green-600 font-medium">2 days ago</span>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-gray-900 mb-2">Building Better Prompts</h4>
              <p className="text-sm text-gray-600 mb-3">
                Master the art of prompt engineering with these proven techniques...
              </p>
              <span className="text-xs text-green-600 font-medium">5 days ago</span>
            </div>
          </div>

          <Link
            href="/blog"
            className="w-full block text-center bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            Read All Blog Posts →
          </Link>
        </div>
      </div>
    </div>
  )
}