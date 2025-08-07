'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { documentsService, type Document, type DocumentWithAccess } from '@/lib/documents'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'
import { useAdmin } from '@/contexts/AdminContext'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import SmartNavigation from '@/components/SmartNavigation'
import GradientBackground from '@/components/NetworkBackground'
import DescriptionModal from '@/components/DescriptionModal'


export default function DocumentsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<DocumentWithAccess[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const { getEffectiveUser, adminViewMode } = useAdmin()
  const router = useRouter()
  
  // Get effective user for display (applies global admin toggle)
  const effectiveUser = getEffectiveUser(user)

  const loadData = async () => {
    try {
      // Check authentication first - Playbooks require account
      const { user: authUser, error } = await auth.getUser()
      
      if (error || !authUser) {
        router.push('/login')
        return
      }

      // Get user profile
      let userProfile = await userService.getProfile(authUser.id)
      
      // If no profile exists, create one (for existing auth users)
      if (!userProfile) {
        userProfile = await userService.createProfile(authUser.id, authUser.email || '')
      }
      
      if (userProfile) {
        setUser(userProfile)
      } else {
        router.push('/login')
        return
      }

      // Load documents, categories, and content stats with access control
      console.log('🔄 Fetching fresh documents data...')
      const effectiveUserTier = getEffectiveUser(userProfile)?.user_tier || 'free'
      console.log('👤 User profile tier:', userProfile?.user_tier)
      console.log('🎭 Effective user tier:', effectiveUserTier)
      console.log('🔧 Admin view mode:', adminViewMode)
      
      const [allDocuments, allCategories, stats] = await Promise.all([
        documentsService.getAllDocumentsWithAccess(effectiveUserTier),
        documentsService.getCategories(),
        contentStatsService.getContentStats(effectiveUserTier)
      ])
      console.log('📊 Loaded documents:', allDocuments.length)
      console.log('🔒 First document access:', allDocuments[0]?.hasAccess)
      
      setDocuments(allDocuments)
      setCategories(['All', ...allCategories])
      setContentStats(stats)
    } catch (err) {
      console.error('Error loading data:', err)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    
    // Listen for auth state changes
    const { supabase } = auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Documents Page: Auth state changed:', event)
      if (event === 'SIGNED_OUT') {
        // User signed out - redirect to login
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session?.user) {
        // User signed in - refresh data
        setLoading(true)
        loadData()
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Refetch data when admin view mode changes
  useEffect(() => {
    if (user) {
      console.log('🔄 Admin view mode changed to:', adminViewMode)
      setLoading(true)
      loadData()
    }
  }, [adminViewMode])

  // Refetch data when the page becomes visible (handles browser back/forward)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page is visible again, refetch data
        setLoading(true)
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also listen for focus events (when user switches back to tab)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [])

  const filteredDocuments = selectedCategory === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory)

  const featuredDocuments = filteredDocuments.filter(doc => doc.is_featured)
  const regularDocuments = filteredDocuments.filter(doc => !doc.is_featured)

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      'Business Planning': { emoji: '💼', color: 'from-blue-500 to-blue-600' },
      'Productivity': { emoji: '⚡', color: 'from-yellow-500 to-orange-500' },
      'Communication': { emoji: '💬', color: 'from-green-500 to-emerald-600' },
      'Automation': { emoji: '🤖', color: 'from-purple-500 to-violet-600' },
      'Marketing': { emoji: '📈', color: 'from-pink-500 to-rose-600' },
      'Design': { emoji: '🎨', color: 'from-indigo-500 to-purple-600' },
      'Development': { emoji: '💻', color: 'from-cyan-500 to-blue-600' },
      'Education': { emoji: '📚', color: 'from-amber-500 to-yellow-600' },
      'Writing': { emoji: '✍️', color: 'from-teal-500 to-cyan-600' },
      'Analysis': { emoji: '📊', color: 'from-red-500 to-pink-600' },
      'Research': { emoji: '🔍', color: 'from-slate-500 to-gray-600' },
      'Finance': { emoji: '💰', color: 'from-green-600 to-emerald-700' },
      'Strategy': { emoji: '🎯', color: 'from-purple-600 to-pink-600' }
    }
    
    return categoryMap[category as keyof typeof categoryMap] || { emoji: '📚', color: 'from-gray-500 to-slate-600' }
  }

  const renderDescription = (document: DocumentWithAccess) => {
    const shouldTruncate = document.description.length > 120
    const truncatedText = shouldTruncate 
      ? document.description.slice(0, 120) + '...'
      : document.description
    
    return (
      <div className="mb-4">
        <p className="text-gray-100 text-sm leading-relaxed mb-3">
          {truncatedText}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setSelectedDocument(document)}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors py-2 px-1 -mx-1 min-h-[44px] flex items-center"
          >
            Read more →
          </button>
        )}
      </div>
    )
  }

  const renderDownloadButton = (document: DocumentWithAccess) => {
    if (document.hasAccess) {
      return (
        <button
          onClick={() => handleDownload(document)}
          disabled={downloadingIds.has(document.id)}
          className={`w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
            downloadingIds.has(document.id)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white button-hover'
          }`}
        >
          {downloadingIds.has(document.id) ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Downloading...
            </>
          ) : (
            'Download PDF 📥'
          )}
        </button>
      )
    } else {
      // Redirect to pricing page for all upgrades
      const pricingUrl = '/plan'
      
      return (
        <div className="w-full text-center">
          <Link
            href={pricingUrl}
            className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            🔒 View Pricing
          </Link>
          {document.upgradeMessage && (
            <p className="text-xs text-gray-100 mt-2">{document.upgradeMessage}</p>
          )}
        </div>
      )
    }
  }

  const handleDownload = async (doc: DocumentWithAccess) => {
    if (!doc.hasAccess) {
      const requiredTier = doc.required_tier || 'pro'
      router.push('/pricing')
      return
    }

    // Add to downloading state
    setDownloadingIds(prev => new Set(prev).add(doc.id))

    try {
      const downloadUrl = await documentsService.downloadDocument(doc.id, effectiveUser?.user_tier || 'free')
      if (downloadUrl) {
        // Fetch the file as a blob and create download
        const response = await fetch(downloadUrl)
        const blob = await response.blob()
        
        // Create object URL from blob
        const objectUrl = URL.createObjectURL(blob)
        
        // Create download link
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = `${doc.title}.pdf`
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up object URL
        URL.revokeObjectURL(objectUrl)
      }
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      // Remove from downloading state after a short delay
      setTimeout(() => {
        setDownloadingIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(doc.id)
          return newSet
        })
      }, 1000)
    }
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
    <DarkThemeBackground>
      <SmartNavigation user={user} currentPage="documents" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-4 sm:pb-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            AI Playbooks Collection 📚
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-100 max-w-3xl mx-auto px-2 sm:px-0 mobile-readable">
            {effectiveUser && (effectiveUser.user_tier === 'pro' || effectiveUser.user_tier === 'ultra')
              ? "Download playbooks below and start implementing proven AI workflows today!"
              : "Explore our playbook collection. Upgrade to access playbooks!"
            }
          </p>
        </div>

        {/* Upgrade Banner for Free Users */}
        {effectiveUser && effectiveUser.user_tier === 'free' && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Unlock Playbooks! 📚</h3>
                <p className="text-sm sm:text-base text-purple-100">
                  Pro (£7/month): 2 core playbooks | Ultra (£19/month): All {contentStats?.totalPlaybooks || 10} playbooks
                </p>
              </div>
              <Link
                href="/plan"
                className="bg-slate-800/80 text-purple-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg whitespace-nowrap text-sm sm:text-base mobile-touch-target touch-feedback"
              >
                View Plans 🚀
              </Link>
            </div>
          </div>
        )}

        {/* Upgrade Banner for Pro Users */}
        {effectiveUser && effectiveUser.user_tier === 'pro' && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Upgrade to Ultra! 🚀</h3>
                <p className="text-sm sm:text-base text-purple-100">
                  Get access to all {contentStats?.totalPlaybooks || 10} playbooks for the complete toolkit.
                </p>
              </div>
              <Link
                href="/plan"
                className="bg-slate-800/80 text-purple-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg whitespace-nowrap text-sm sm:text-base mobile-touch-target touch-feedback"
              >
                Upgrade to Ultra ✨
              </Link>
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-12">
            <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100/50">
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => {
                  const categoryInfo = category === 'All' 
                    ? { emoji: '📋', color: 'from-purple-600 to-pink-600' }
                    : getCategoryInfo(category)
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 mobile-touch-target touch-feedback shadow-md hover:shadow-lg ${
                        selectedCategory === category
                          ? `bg-gradient-to-r ${categoryInfo.color} text-white shadow-lg transform scale-105 border border-white/20`
                          : 'bg-slate-800/90 text-gray-100 border border-gray-600 hover:border-purple-300/60 hover:text-white hover:scale-105 hover:bg-slate-700/90 backdrop-blur-sm'
                      }`}
                    >
                      <span className="text-base mr-2">{categoryInfo.emoji}</span>
                      {category}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Featured Documents - Only show when viewing "All" category */}
        {featuredDocuments.length > 0 && selectedCategory === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">⭐</span>
              Featured Playbooks
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="bg-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full touch-feedback"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600-subtle rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">{getCategoryInfo(document.category).emoji}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {document.title}
                        </h3>
                        <span className="text-xs font-medium text-purple-200 bg-purple-900/30 px-2 py-1 rounded-full">
                          {document.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xs font-medium bg-yellow-900/30 text-yellow-200 px-2 py-1 rounded-full">
                        ⭐ Featured
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {renderDescription(document)}
                  </div>
                  
                  <div className="mt-auto">
                    {renderDownloadButton(document)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Documents or Regular Documents */}
        {(selectedCategory === 'All' ? regularDocuments : filteredDocuments).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">{selectedCategory === 'All' ? '📚' : getCategoryInfo(selectedCategory).emoji}</span>
              {selectedCategory === 'All' ? 'All Playbooks' : `${selectedCategory} Playbooks`}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(selectedCategory === 'All' ? regularDocuments : filteredDocuments).map((document) => (
                <div
                  key={document.id}
                  className={`bg-slate-800/80 rounded-2xl p-6 shadow-lg border ${
                    document.is_featured && selectedCategory !== 'All'
                      ? 'border-purple-100'
                      : 'border-gray-200 hover:border-purple-200'
                  } hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${
                        document.is_featured && selectedCategory !== 'All'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600-subtle'
                          : 'bg-gray-700'
                      } rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{getCategoryInfo(document.category).emoji}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {document.title}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          document.is_featured && selectedCategory !== 'All'
                            ? 'text-purple-200 bg-purple-900/30'
                            : 'text-gray-100 bg-gray-700'
                        }`}>
                          {document.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {document.is_featured && selectedCategory !== 'All' && (
                        <span className="text-xs font-medium bg-yellow-900/30 text-yellow-200 px-2 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {renderDescription(document)}
                  </div>
                  
                  <div className="mt-auto">
                    {renderDownloadButton(document)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No playbooks available yet
            </h3>
            <p className="text-gray-100">
              I'm currently building my collection of step-by-step AI playbooks. Check back soon!
            </p>
          </div>
        )}

        {/* No results for category */}
        {documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No playbooks found in this category
            </h3>
            <p className="text-gray-100">
              Try selecting a different category or check back later for new playbooks!
            </p>
          </div>
        )}

        {/* Description Modal */}
        <DescriptionModal
          isOpen={selectedDocument !== null}
          onClose={() => setSelectedDocument(null)}
          title={selectedDocument?.title || ''}
          description={selectedDocument?.description || ''}
          category={selectedDocument?.category || ''}
          categoryIcon={getCategoryInfo(selectedDocument?.category || '').emoji}
          type="playbook"
        />
      </div>
    </DarkThemeBackground>
  )
}