'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { documentsService, type Document, type DocumentWithAccess } from '@/lib/documents'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'
import { useAdmin } from '@/contexts/AdminContext'
import SmartNavigation from '@/components/SmartNavigation'
import DarkThemeBackground from '@/components/DarkThemeBackground'
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
  const { getEffectiveUser } = useAdmin()
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
      const [allDocuments, allCategories, stats] = await Promise.all([
        documentsService.getAllDocumentsWithAccess(effectiveUserTier),
        documentsService.getCategories(),
        contentStatsService.getContentStats(effectiveUserTier)
      ])
      console.log('📊 Loaded documents:', allDocuments.length)
      
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
  }, [router])

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Business Planning': return '💼'
      case 'Productivity': return '⚡'
      case 'Marketing': return '📈'
      case 'Automation': return '🤖'
      case 'Design': return '🎨'
      case 'Development': return '💻'
      default: return '📚'
    }
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
            className="text-purple-600 hover:text-purple-700 text-xs font-medium transition-colors"
          >
            Read more
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
              : 'gradient-purple text-white button-hover'
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
      return (
        <div className="w-full text-center">
          <div className="w-full text-center bg-gray-700 text-gray-100 py-3 px-4 rounded-xl font-semibold border-2 border-dashed border-gray-500 mb-3">
            🔒 Upgrade to Download
          </div>
          {document.upgradeMessage && (
            <p className="text-xs text-gray-100 mb-2">{document.upgradeMessage}</p>
          )}
          <Link
            href="/upgrade"
            className="inline-block text-purple-600 hover:text-purple-700 text-xs font-medium"
          >
            View Upgrade Options →
          </Link>
        </div>
      )
    }
  }

  const handleDownload = async (doc: DocumentWithAccess) => {
    if (!doc.hasAccess) {
      router.push('/upgrade')
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
      {/* Smart Navigation */}
      <SmartNavigation user={user} currentPage="documents" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
          <div className="mb-6 sm:mb-8 gradient-purple rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Unlock Playbooks! 📚</h3>
                <p className="text-sm sm:text-base text-purple-100">
                  Pro (£7/month): 2 core playbooks | Ultra (£19/month): All {contentStats?.totalPlaybooks || 10} playbooks
                </p>
              </div>
              <Link
                href="/upgrade"
                className="bg-slate-800/80 text-purple-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg whitespace-nowrap text-sm sm:text-base mobile-touch-target touch-feedback"
              >
                View Pricing 🚀
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
                href="/upgrade"
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
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'gradient-purple text-white shadow-lg transform scale-105'
                        : 'bg-gray-800 text-gray-100 border border-gray-600 hover:border-purple-300 hover:text-purple-400 hover:scale-105'
                    }`}
                  >
                    {category === 'All' ? '📋' : getCategoryIcon(category)} {category}
                  </button>
                ))}
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
                      <div className="w-12 h-12 gradient-purple-subtle rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">{getCategoryIcon(document.category)}</span>
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
              <span className="text-3xl mr-3">{selectedCategory === 'All' ? '📚' : getCategoryIcon(selectedCategory)}</span>
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
                          ? 'gradient-purple-subtle'
                          : 'bg-gray-700'
                      } rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{getCategoryIcon(document.category)}</span>
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
          categoryIcon={getCategoryIcon(selectedDocument?.category || '')}
          type="playbook"
        />
      </div>
    </DarkThemeBackground>
  )
}