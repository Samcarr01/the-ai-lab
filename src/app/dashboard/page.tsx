'use client'

// Force dynamic rendering to avoid build-time database calls
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile, type UserTier, TIER_FEATURES, getUserDisplayName } from '@/lib/user'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'
import { useAdmin } from '@/contexts/AdminContext'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import SmartNavigation from '@/components/SmartNavigation'
import { gptsService } from '@/lib/gpts'
import { documentsService } from '@/lib/documents'

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [stats, setStats] = useState({ gpts: 0, documents: 0, blogPosts: 0 })
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null)
  const { getEffectiveUser } = useAdmin()
  const router = useRouter()
  
  // Get effective user for display (applies global admin toggle)
  const effectiveUser = getEffectiveUser(user)


  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    const getUser = async () => {
      if (!isMounted) return // Prevent execution if component unmounted
      
      console.log('🔄 Dashboard: Starting auth check...')
      
      // Set a faster timeout since auth should be session-based
      timeoutId = setTimeout(() => {
        if (!isMounted) return
        console.error('🚨 Dashboard: Auth loading timeout after 5 seconds - trying alternative approach')
        
        // Instead of failing, try to continue without auth (fallback mode)
        setLoading(false)
        setRateLimitError(true) // Show connection error instead of complete failure
      }, 5000) // 5 second timeout for faster UX
      
      try {
        // Race the auth call against a timeout to prevent hanging
        const authPromise = auth.getUser()
        const timeoutPromise = new Promise<{ user: null, error: { message: string } }>((resolve) => {
          setTimeout(() => {
            resolve({ user: null, error: { message: 'Auth request timeout' } })
          }, 8000) // 8 second auth-specific timeout
        })
        
        const { user: authUser, error } = await Promise.race([authPromise, timeoutPromise])
        
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        console.log('✅ Dashboard: Auth check result:', { 
          hasUser: !!authUser, 
          userId: authUser?.id,
          email: authUser?.email,
          error: error?.message 
        })
        
        // Update debug info
        setAuthDebugInfo({
          timestamp: new Date().toISOString(),
          authUser: authUser ? {
            id: authUser.id,
            email: authUser.email,
            metadata: authUser.user_metadata
          } : null,
          error: error?.message || null,
          step: 'auth_check_complete'
        })
        
        // Handle auth errors
        if (error || !authUser) {
          console.log('❌ Dashboard: No valid user, handling error', { error: error?.message })
          
          // Handle different error types
          if (error?.message?.includes('Network error') || error?.message?.includes('timeout') || error?.message?.includes('Auth request timeout')) {
            console.log('🌐 Dashboard: Network/timeout error - trying to continue with limited functionality')
            if (!isMounted) return
            setLoading(false)
            setRateLimitError(true) // Use existing error state for network issues
            
            // Try to show dashboard with offline/limited functionality
            try {
              // Check if we have cached user data in localStorage  
              const cachedUserData = localStorage.getItem('cached-user-profile')
              if (cachedUserData) {
                const cachedUser = JSON.parse(cachedUserData)
                console.log('📱 Dashboard: Using cached user data for offline experience')
                setUser(cachedUser)
              }
            } catch {
              console.log('📱 Dashboard: No cached data available, showing guest mode')
            }
            return
          }
          
          // Clear invalid auth data for auth-related errors
          if (error?.message?.includes('Refresh Token') || error?.message?.includes('Invalid') || error?.message?.includes('expired') || error?.message?.includes('permission')) {
            console.log('🧹 Dashboard: Clearing invalid auth data...')
            await auth.clearAuthData()
          }
          
          if (!isMounted) return
          setLoading(false)
          router.push('/login?error=auth_failed')
          return
        }

        // Fetch user profile
        console.log('🔍 Dashboard: Fetching user profile from database...')
        
        try {
          let userProfile = await userService.getProfile(authUser.id)
          console.log('📋 Dashboard: Profile result:', { hasProfile: !!userProfile })
          
          // Create profile if missing
          if (!userProfile) {
            console.log('🔧 Dashboard: Creating new profile...')
            const firstName = authUser.user_metadata?.first_name || ''
            const lastName = authUser.user_metadata?.last_name || ''
            
            userProfile = await userService.createProfile(authUser.id, authUser.email || '', firstName, lastName)
            console.log('✅ Dashboard: Profile created:', { success: !!userProfile })
          }
          
          if (userProfile && isMounted) {
            setUser(userProfile)
            setLoading(false)
            
            // Cache user data for offline fallback
            try {
              localStorage.setItem('cached-user-profile', JSON.stringify(userProfile))
              console.log('💾 Dashboard: User profile cached for offline use')
            } catch (e) {
              console.log('⚠️ Dashboard: Could not cache user profile:', e)
            }
            
            // Load stats in background
            loadStats(userProfile.user_tier || 'free').catch(error => {
              console.error('Background stats loading failed:', error)
            })
          } else {
            console.error('Failed to load or create user profile')
            if (!isMounted) return
            setLoading(false)
            router.push('/login')
          }
        } catch (profileError: any) {
          console.error('❌ Dashboard: Profile error:', profileError)
          
          // Handle rate limits
          if (profileError?.message?.includes('rate limit') || profileError?.message?.includes('429')) {
            console.log('🚨 Dashboard: Rate limit detected')
            if (isMounted) {
              setRateLimitError(true)
              setLoading(false)
            }
            return
          }
          
          if (!isMounted) return
          setLoading(false)
          router.push('/login')
        }
      } catch (err) {
        console.error('❌ Dashboard: Auth error:', err)
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        if (!isMounted) return
        setLoading(false)
        setTimeout(() => router.push('/login'), 100)
      }
    }

    const loadStats = async (userTier: UserTier = 'free') => {
      try {
        console.log('Dashboard: Loading stats for tier:', userTier)
        const [gptsData, documentsData, contentStatsData] = await Promise.all([
          gptsService.getAllGPTs(),
          documentsService.getAllDocuments(),
          contentStatsService.getContentStats(userTier)
        ])
        
        console.log('Dashboard: Stats loaded successfully', { 
          gpts: gptsData.length, 
          documents: documentsData.length 
        })
        
        setStats({
          gpts: gptsData.length,
          documents: documentsData.length,
          blogPosts: 0 // Will be updated when blog is implemented
        })
        
        setContentStats(contentStatsData)
      } catch (error) {
        console.error('Dashboard: Error loading stats:', error)
        // Set default values on error
        setStats({ gpts: 0, documents: 0, blogPosts: 0 })
        setContentStats({
          totalGPTs: 0,
          totalDocuments: 0,
          totalPlaybooks: 0,
          accessibleGPTs: 0,
          accessibleDocuments: 0,
          accessiblePlaybooks: 0
        })
      }
    }

    getUser()
    
    // Listen for auth state changes
    const { supabase } = auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Dashboard: Auth state changed:', event)
      
      // Only act on meaningful state changes, ignore INITIAL_SESSION
      if (event === 'SIGNED_OUT') {
        console.log('Dashboard: User signed out, redirecting to login')
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session?.user && !user) {
        // Only refresh if we don't already have user data
        console.log('Dashboard: User signed in, refreshing profile')
        try {
          let userProfile = await userService.getProfile(session.user.id)
          if (!userProfile) {
            userProfile = await userService.createProfile(session.user.id, session.user.email || '')
          }
          if (userProfile) {
            setUser(userProfile)
            // Load stats in background (non-blocking)
            loadStats(userProfile.user_tier || 'free').catch(error => {
              console.error('Background stats loading failed:', error)
            })
          }
        } catch (error) {
          console.error('Dashboard: Error in auth state change handler:', error)
        }
      } else {
        console.log('Dashboard: Ignoring auth state change:', event)
      }
    })
    
    return () => {
      isMounted = false // Cleanup flag
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
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


  if (loading) {
    return (
      <DarkThemeBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <div className="animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-purple-400 opacity-20"></div>
            </div>
            <p className="text-gray-300 text-lg font-medium">Loading your dashboard...</p>
            <p className="text-gray-500 text-sm mt-2">Authenticating and loading your profile</p>
            {authDebugInfo && (
              <p className="text-xs text-gray-600 mt-1">Status: {authDebugInfo.step}</p>
            )}
          </div>
        </div>
      </DarkThemeBackground>
    )
  }

  if (!user) {
    return (
      <DarkThemeBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Unable to Load Dashboard</h2>
            <p className="text-gray-400 mb-4">There was an error loading your profile.</p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
              <button 
                onClick={() => router.push('/login')} 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </DarkThemeBackground>
    )
  }

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} currentPage="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
        {/* Debug Panel Toggle */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-xs border border-gray-600 hover:bg-gray-700"
          >
            🐛 Debug
          </button>
        </div>

        {/* Debug Panel */}
        {debugMode && (
          <div className="mb-8 p-4 bg-gray-900/90 border border-gray-600 rounded-lg text-xs font-mono">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-yellow-400 font-semibold">Dashboard Debug Info</h3>
              <button
                onClick={() => setDebugMode(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              <div><span className="text-blue-300">Loading:</span> <span className="text-white">{loading.toString()}</span></div>
              <div><span className="text-blue-300">User:</span> <span className="text-white">{user ? `${user.email} (${user.user_tier})` : 'null'}</span></div>
              <div><span className="text-blue-300">Rate Limit Error:</span> <span className="text-white">{rateLimitError.toString()}</span></div>
              {authDebugInfo && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-green-300 mb-2">Auth Debug:</div>
                  <pre className="text-gray-300 whitespace-pre-wrap text-xs">
                    {JSON.stringify(authDebugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Upgrade Success Message */}
        {showUpgradeSuccess && (
          <div className="mb-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="text-lg font-semibold text-green-300">Welcome to Pro!</h3>
                  <p className="text-sm text-green-200">
                    Your upgrade was successful! You now have full access to all GPTs and PDF guides.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeSuccess(false)}
                className="text-green-300 hover:text-green-100 text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Network/Connection Error Message */}
        {rateLimitError && (
          <div className="mb-8 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <h3 className="text-lg font-semibold text-orange-300">Limited Connectivity</h3>
                  <p className="text-sm text-orange-200">
                    {user ? 'Using cached data. Some features may be limited until connection is restored.' 
                         : 'Connection timeout. Please try refreshing or check your internet connection.'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setLoading(true)
                    setRateLimitError(false)
                    window.location.reload()
                  }}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                >
                  Retry
                </button>
                <button
                  onClick={() => setRateLimitError(false)}
                  className="text-orange-300 hover:text-orange-100 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-br from-purple-900/20 via-slate-800 to-purple-900/10 rounded-3xl p-8 border border-purple-500/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
                  <span className="text-2xl">👋</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">
                    Welcome back, {getUserDisplayName(user)}!
                  </h1>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.email === 'samcarr1232@gmail.com'
                        ? 'bg-red-100 text-red-700'
                        : user.user_tier === 'ultra' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : user.user_tier === 'pro'
                            ? 'bg-purple-900/30 text-purple-200'
                            : 'bg-gray-700 text-gray-100'
                    }`}>
                      {user.email === 'samcarr1232@gmail.com' ? '🔧 Admin' : 
                       user.user_tier === 'ultra' ? '🚀 Ultra Member' :
                       user.user_tier === 'pro' ? '✨ Pro Member' : '🆓 Free Member'}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <p className="text-xl text-gray-100 leading-relaxed">
                {(user.user_tier === 'pro' || user.user_tier === 'ultra') || user.email === 'samcarr1232@gmail.com'
                  ? "You have access to battle-tested AI playbooks and GPTs that actually work. Upload the PDFs directly to any LLM (ChatGPT, Claude, Gemini, etc.) to make it smarter at specific tasks."
                  : "Get AI workflows that actually work! Upgrade to Pro (£7/month) or Ultra (£19/month) for full access to battle-tested playbooks and GPTs."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Plan Management Section */}
        <div className="mb-8 text-center">
          <Link
            href="/plan"
            className="inline-flex items-center gradient-purple text-white px-8 py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg"
          >
            {user.user_tier === 'ultra' ? 'Manage Plan' : 
             user.user_tier === 'pro' ? 'Manage Plan & Upgrade' : 
             'View Plans'} ⚡
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-100 mb-1">GPTs Available</p>
                <p className="text-4xl font-bold text-purple-600">{stats.gpts}</p>
                <p className="text-xs text-gray-400 mt-1">Ready to explore</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🤖</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-100 mb-1">Playbooks</p>
                <p className="text-4xl font-bold text-purple-600">{stats.documents}</p>
                <p className="text-xs text-gray-400 mt-1">PDF guides available</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">📚</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-100 mb-1">Blog Posts</p>
                <p className="text-4xl font-bold text-purple-600">{stats.blogPosts}</p>
                <p className="text-xs text-gray-400 mt-1">Coming soon</p>
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
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">AI GPTs</h3>
                  <p className="text-sm text-gray-300">
                    {user.user_tier === 'free' ? 'Preview available • Upgrade for access' : 
                     user.user_tier === 'pro' ? 'Access to 3 essential GPTs' : 
                     'Full access to all 7 GPTs'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💼</span>
                  <span className="font-medium text-gray-100">Business Planning</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">✅ Access</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium text-gray-100">Productivity</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">✅ Access</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🗣️</span>
                  <span className="font-medium text-gray-100">Communication</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">✅ Access</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-gray-100">Automation</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">✅ Access</span>
                )}
              </div>
            </div>

            <Link
              href="/gpts"
              className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
            >
              Browse All GPTs →
            </Link>
          </div>

          {/* Playbooks Section */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-100">AI Playbooks</h3>
                  <p className="text-sm text-gray-100">
                    {user.user_tier === 'free' ? 'Preview available • Upgrade to download' :
                     user.user_tier === 'pro' ? 'Download 2 core playbooks' :
                     'Download all playbooks for any LLM knowledge'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">💼</span>
                  <span className="font-medium text-gray-100">Business Strategy</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">📥 Download</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium text-gray-100">Productivity Systems</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">📥 Download</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-medium text-gray-100">Marketing & Content</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">📥 Download</span>
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-gray-100">AI Workflows</span>
                </div>
                {user.user_tier === 'free' ? (
                  <span className="text-purple-600 text-sm">👀 Preview</span>
                ) : (
                  <span className="text-green-600 text-sm">📥 Download</span>
                )}
              </div>
            </div>

            <Link
              href="/documents"
              className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
            >
              Browse All Playbooks →
            </Link>
          </div>
        </div>

        {/* How to Use Section */}
        <div className="mt-8 bg-slate-800/60 rounded-2xl p-8 shadow-lg border border-green-500/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-100">How to Use Your Playbooks</h3>
                <p className="text-sm text-green-400">Step-by-step instructions 📚</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-green-900/30 rounded-xl">
              <h4 className="font-semibold text-white mb-2 flex items-center space-x-2">
                <span>🤖</span>
                <span>For ChatGPT</span>
              </h4>
              <p className="text-sm text-gray-100 mb-3">
                Download PDFs → Upload to ChatGPT → Select "Create GPT" → Upload as knowledge files → Start chatting with enhanced AI
              </p>
            </div>
            
            <div className="p-4 bg-green-900/30 rounded-xl">
              <h4 className="font-semibold text-white mb-2 flex items-center space-x-2">
                <span>🧠</span>
                <span>For Claude</span>
              </h4>
              <p className="text-sm text-gray-100 mb-3">
                Download PDFs → Start new conversation → Upload files → Claude will reference them in responses → Enhanced AI assistance
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-900/30 rounded-xl">
            <h4 className="font-semibold text-white mb-2 flex items-center space-x-2">
              <span>⚡</span>
              <span>Pro Tip</span>
            </h4>
            <p className="text-sm text-gray-100">
              Upload multiple playbooks together for comprehensive AI knowledge. Each PDF contains battle-tested workflows and strategies that enhance your AI assistant's capabilities.
            </p>
          </div>
        </div>
      </div>
    </DarkThemeBackground>
  )
}