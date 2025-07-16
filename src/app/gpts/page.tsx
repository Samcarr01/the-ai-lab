'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { gptsService, type GPT, type GPTWithAccess } from '@/lib/gpts'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'
import { useAdmin } from '@/contexts/AdminContext'
import SmartNavigation from '@/components/SmartNavigation'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import GradientBackground from '@/components/NetworkBackground'
import DescriptionModal from '@/components/DescriptionModal'


export default function GPTsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [gpts, setGpts] = useState<GPTWithAccess[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [selectedGpt, setSelectedGpt] = useState<GPT | null>(null)
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  const { getEffectiveUser } = useAdmin()
  const router = useRouter()
  
  // Get effective user for display (applies global admin toggle)
  const effectiveUser = getEffectiveUser(user)

  const loadData = async () => {
    try {
      // Check authentication first - GPTs require account
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

      // Load GPTs, categories, and content stats with access control
      const effectiveUserTier = getEffectiveUser(userProfile)?.user_tier || 'free'
      const [allGpts, allCategories, stats] = await Promise.all([
        gptsService.getAllGPTsWithAccess(effectiveUserTier),
        gptsService.getCategories(),
        contentStatsService.getContentStats(effectiveUserTier)
      ])
      
      setGpts(allGpts)
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

  const filteredGpts = selectedCategory === 'All' 
    ? gpts 
    : gpts.filter(gpt => gpt.category === selectedCategory)

  const featuredGpts = filteredGpts.filter(gpt => gpt.is_featured)
  const regularGpts = filteredGpts.filter(gpt => !gpt.is_featured)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Business Planning': return '💼'
      case 'Productivity': return '⚡'
      case 'Communication': return '📧'
      case 'Automation': return '🤖'
      default: return '🔧'
    }
  }

  const renderDescription = (gpt: GPTWithAccess) => {
    const shouldTruncate = gpt.description.length > 120
    const truncatedText = shouldTruncate 
      ? gpt.description.slice(0, 120) + '...'
      : gpt.description
    
    return (
      <div className="mb-4">
        <p className="text-gray-100 text-sm leading-relaxed mb-3">
          {truncatedText}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setSelectedGpt(gpt)}
            className="text-purple-600 hover:text-purple-700 text-xs font-medium transition-colors"
          >
            Read more
          </button>
        )}
      </div>
    )
  }

  const renderAccessButton = (gpt: GPTWithAccess) => {
    if (gpt.hasAccess) {
      return (
        <a
          href={gpt.chatgpt_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
        >
          Open GPT ✨
        </a>
      )
    } else {
      return (
        <div className="w-full text-center">
          <div className="w-full text-center bg-gray-700 text-gray-100 py-3 px-4 rounded-xl font-semibold border-2 border-dashed border-gray-500 mb-3">
            🔒 Upgrade to Access
          </div>
          {gpt.upgradeMessage && (
            <p className="text-xs text-gray-100 mb-2">{gpt.upgradeMessage}</p>
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
      <SmartNavigation user={user} currentPage="gpts" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            AI GPTs Collection 🤖
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-100 max-w-3xl mx-auto px-2 sm:px-0 mobile-readable">
            {effectiveUser && (effectiveUser.user_tier === 'pro' || effectiveUser.user_tier === 'ultra')
              ? "Click any GPT below to open it directly in ChatGPT and start using it!"
              : "Explore my personal GPT collection. Upgrade for direct access to GPTs!"
            }
          </p>
        </div>

        {/* Upgrade Banner for Free Users */}
        {effectiveUser && effectiveUser.user_tier === 'free' && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Unlock GPTs! ⚡</h3>
                <p className="text-sm sm:text-base text-purple-100">
                  Pro (£7/month): 3 essential GPTs | Ultra (£19/month): All {contentStats?.totalGPTs || 7} GPTs
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
                  Get access to all {contentStats?.totalGPTs || 7} GPTs for the complete AI toolkit.
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
        <div className="mb-8 sm:mb-12">
          <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100/50">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 mobile-touch-target touch-feedback ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-800 text-gray-100 border border-gray-600 hover:border-purple-300 hover:text-purple-400 hover:scale-105'
                  }`}
                >
                  {category === 'All' ? '🎯' : getCategoryIcon(category)} {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured GPTs - Only show when viewing "All" category */}
        {featuredGpts.length > 0 && selectedCategory === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">⭐</span>
              Featured GPTs
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredGpts.map((gpt) => (
                <div
                  key={gpt.id}
                  className="bg-slate-800/80 rounded-2xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600-subtle rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">{getCategoryIcon(gpt.category)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {gpt.title}
                        </h3>
                        <span className="text-xs font-medium text-purple-200 bg-purple-900/30 px-2 py-1 rounded-full">
                          {gpt.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xl">⭐</span>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {renderDescription(gpt)}
                  </div>
                  
                  <div className="mt-auto">
                    {renderAccessButton(gpt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category GPTs or Regular GPTs */}
        {(selectedCategory === 'All' ? regularGpts : filteredGpts).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">{selectedCategory === 'All' ? '🤖' : getCategoryIcon(selectedCategory)}</span>
              {selectedCategory === 'All' ? 'All GPTs' : `${selectedCategory} GPTs`}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(selectedCategory === 'All' ? regularGpts : filteredGpts).map((gpt) => (
                <div
                  key={gpt.id}
                  className={`bg-slate-800/80 rounded-2xl p-6 shadow-lg border ${
                    gpt.is_featured && selectedCategory !== 'All'
                      ? 'border-purple-100'
                      : 'border-gray-200 hover:border-purple-200'
                  } hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${
                        gpt.is_featured && selectedCategory !== 'All'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600-subtle'
                          : 'bg-gray-700'
                      } rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{getCategoryIcon(gpt.category)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {gpt.title}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          gpt.is_featured && selectedCategory !== 'All'
                            ? 'text-purple-200 bg-purple-900/30'
                            : 'text-gray-100 bg-gray-700'
                        }`}>
                          {gpt.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      {gpt.is_featured && selectedCategory !== 'All' && (
                        <span className="text-xl">⭐</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    {renderDescription(gpt)}
                  </div>
                  
                  <div className="mt-auto">
                    {renderAccessButton(gpt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredGpts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No GPTs found
            </h3>
            <p className="text-gray-100">
              Try selecting a different category or check back later for new GPTs!
            </p>
          </div>
        )}

        {/* Description Modal */}
        <DescriptionModal
          isOpen={selectedGpt !== null}
          onClose={() => setSelectedGpt(null)}
          title={selectedGpt?.title || ''}
          description={selectedGpt?.description || ''}
          category={selectedGpt?.category || ''}
          categoryIcon={getCategoryIcon(selectedGpt?.category || '')}
          type="gpt"
        />
      </div>
    </DarkThemeBackground>
  )
}