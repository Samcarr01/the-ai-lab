'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { documentsService, type Document } from '@/lib/documents'
import InternalMobileNavigation from '@/components/InternalMobileNavigation'


export default function DocumentsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const router = useRouter()

  const loadData = async () => {
    try {
      // Check authentication
      const { user: authUser, error } = await auth.getUser()
      
      if (error || !authUser) {
        router.push('/login')
        return
      }

      // Get user profile
      const userProfile = await userService.getProfile(authUser.id)
      if (userProfile) {
        setUser(userProfile)
      }

      // Load documents and categories (always fresh data with cache busting)
      console.log('🔄 Fetching fresh documents data...')
      const [allDocuments, allCategories] = await Promise.all([
        documentsService.getAllDocuments(),
        documentsService.getCategories()
      ])
      console.log('📊 Loaded documents:', allDocuments.length)
      
      setDocuments(allDocuments)
      setCategories(['All', ...allCategories])
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

  const toggleDescription = (docId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const renderDescription = (document: Document) => {
    const isExpanded = expandedDescriptions.has(document.id)
    const shouldTruncate = document.description.length > 150
    
    if (!shouldTruncate) {
      return <p className="text-gray-600 mb-6 text-sm leading-relaxed">{document.description}</p>
    }
    
    const truncatedText = document.description.slice(0, 150) + '...'
    
    return (
      <div className="mb-6">
        <p className="text-gray-600 text-sm leading-relaxed">
          {isExpanded ? document.description : truncatedText}
        </p>
        <button
          onClick={() => toggleDescription(document.id)}
          className="text-purple-600 hover:text-purple-700 text-xs font-medium mt-2 transition-colors"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      </div>
    )
  }

  const handleDownload = async (document: Document) => {
    if (!user?.is_pro) {
      router.push('/upgrade')
      return
    }

    try {
      const downloadUrl = await documentsService.downloadDocument(document.id)
      if (downloadUrl) {
        // Open in new tab for download
        window.open(downloadUrl, '_blank')
      }
    } catch (err) {
      console.error('Download failed:', err)
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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Header */}
      <header className="glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🧪</span>
              </div>
              <span className="text-xl font-semibold text-gradient">The AI Lab</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/gpts" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                GPTs
              </Link>
              <Link href="/blog" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Blog
              </Link>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                user.is_pro 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {user.is_pro ? '✨ Pro' : '🆓 Free'}
              </div>
              {!user.is_pro && (
                <Link 
                  href="/upgrade"
                  className="text-sm gradient-purple text-white px-4 py-2 rounded-full font-medium button-hover"
                >
                  Upgrade
                </Link>
              )}
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
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Playbooks Collection 📚
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {user.is_pro 
              ? "Download any playbook below and start implementing proven AI workflows today!"
              : "Explore our playbook collection. Upgrade to Pro to download all PDF playbooks!"
            }
          </p>
          {user.email === 'samcarr1232@gmail.com' && (
            <button
              onClick={() => {
                setLoading(true)
                loadData()
              }}
              className="text-sm text-purple-600 hover:text-purple-800 underline"
            >
              🔄 Refresh Content (Admin)
            </button>
          )}
        </div>

        {/* Upgrade Banner for Free Users */}
        {!user.is_pro && (
          <div className="mb-8 gradient-purple rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Unlock All Playbooks! 📚</h3>
                <p className="text-purple-100">
                  Currently viewing previews only. Upgrade to Pro to download all {documents.length} PDF playbooks.
                </p>
              </div>
              <Link
                href="/upgrade"
                className="bg-white text-purple-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg whitespace-nowrap"
              >
                Upgrade Now 🚀
              </Link>
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'gradient-purple text-white shadow-lg'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-purple-600'
                  }`}
                >
                  {category === 'All' ? '📋' : getCategoryIcon(category)} {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Documents - Only show when viewing "All" category */}
        {featuredDocuments.length > 0 && selectedCategory === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">⭐</span>
              Featured Playbooks
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 gradient-purple-subtle rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">{getCategoryIcon(document.category)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {document.title}
                        </h3>
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {document.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        ⭐ Featured
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {renderDescription(document)}
                  </div>
                  
                  <div className="mt-auto">
                    {user.is_pro ? (
                      <button
                        onClick={() => handleDownload(document)}
                        className="w-full gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
                      >
                        Download PDF 📥
                      </button>
                    ) : (
                      <div className="w-full text-center bg-gray-100 text-gray-500 py-3 px-4 rounded-xl font-semibold border-2 border-dashed border-gray-300">
                        🔒 Upgrade to Download
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Documents or Regular Documents */}
        {(selectedCategory === 'All' ? regularDocuments : filteredDocuments).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="text-3xl mr-3">{selectedCategory === 'All' ? '📚' : getCategoryIcon(selectedCategory)}</span>
              {selectedCategory === 'All' ? 'All Playbooks' : `${selectedCategory} Playbooks`}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedCategory === 'All' ? regularDocuments : filteredDocuments).map((document) => (
                <div
                  key={document.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg border ${
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
                          : 'bg-gray-100'
                      } rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{getCategoryIcon(document.category)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {document.title}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          document.is_featured && selectedCategory !== 'All'
                            ? 'text-purple-600 bg-purple-100'
                            : 'text-gray-600 bg-gray-100'
                        }`}>
                          {document.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {document.is_featured && selectedCategory !== 'All' && (
                        <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {renderDescription(document)}
                  </div>
                  
                  <div className="mt-auto">
                    {user.is_pro ? (
                      <button
                        onClick={() => handleDownload(document)}
                        className="w-full gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
                      >
                        Download PDF 📥
                      </button>
                    ) : (
                      <div className="w-full text-center bg-gray-100 text-gray-500 py-3 px-4 rounded-xl font-semibold border-2 border-dashed border-gray-300">
                        🔒 Upgrade to Download
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No playbooks available yet
            </h3>
            <p className="text-gray-600">
              I'm currently building my collection of step-by-step AI playbooks. Check back soon!
            </p>
          </div>
        )}

        {/* No results for category */}
        {documents.length > 0 && filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No playbooks found in this category
            </h3>
            <p className="text-gray-600">
              Try selecting a different category or check back later for new playbooks!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}