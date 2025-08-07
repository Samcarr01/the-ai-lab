'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { affiliateToolsService, type AffiliateToolWithAccess } from '@/lib/affiliate-tools'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import SmartNavigation from '@/components/SmartNavigation'

export default function ToolkitPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [tools, setTools] = useState<AffiliateToolWithAccess[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    try {
      // Check authentication (optional for this page)
      const { user: authUser } = await auth.getUser()
      
      let userProfile = null
      if (authUser) {
        userProfile = await userService.getProfile(authUser.id)
        if (!userProfile) {
          userProfile = await userService.createProfile(authUser.id, authUser.email || '')
        }
      }
      
      setUser(userProfile)

      // Load affiliate tools (public access)
      const [toolsData, categoriesData] = await Promise.all([
        affiliateToolsService.getAllWithAccess(),
        affiliateToolsService.getCategories()
      ])

      setTools(toolsData)
      setCategories(categoriesData)
      
    } catch (error) {
      console.error('Error loading toolkit data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredTools = selectedCategory === 'All' 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory)

  const featuredTools = filteredTools.filter(tool => tool.is_featured)
  const regularTools = filteredTools.filter(tool => !tool.is_featured)

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      'Business Planning': { emoji: '💼', color: 'from-blue-500 to-blue-600' },
      'Productivity': { emoji: '⚡', color: 'from-yellow-500 to-orange-500' },
      'Communication': { emoji: '💬', color: 'from-green-500 to-emerald-600' },
      'Automation': { emoji: '🤖', color: 'from-purple-500 to-violet-600' },
      'Marketing': { emoji: '📈', color: 'from-pink-500 to-rose-600' },
      'Design': { emoji: '🎨', color: 'from-indigo-500 to-purple-600' },
      'Development': { emoji: '💻', color: 'from-cyan-500 to-blue-600' },
      'Analysis': { emoji: '📊', color: 'from-red-500 to-pink-600' },
      'Research': { emoji: '🔍', color: 'from-slate-500 to-gray-600' }
    }
    
    return categoryMap[category as keyof typeof categoryMap] || { emoji: '🛠️', color: 'from-gray-500 to-slate-600' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} currentPage="toolkit" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-4 sm:pb-8">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Our Toolkit 🛠️
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-100 max-w-3xl mx-auto px-2 sm:px-0 mobile-readable">
            The battle-tested tools that power our AI workflows. These are the exact tools we use daily to build, automate, and scale our operations.
          </p>
        </div>

        {/* Value Proposition Banner */}
        <div className="mb-8 sm:mb-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-purple-100/30">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Why These Tools? 🎯</h3>
            <p className="text-sm sm:text-base text-gray-100">
              We've tested hundreds of tools. These made the cut because they deliver real results, integrate seamlessly, and actually save time. Each recommendation comes from months of hands-on experience.
            </p>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8 sm:mb-12">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100/50">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {categories.map((category) => {
                  const categoryInfo = category === 'All' 
                    ? { emoji: '🎯', color: 'from-purple-600 to-pink-600' }
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

        {/* Featured Tools */}
        {featuredTools.length > 0 && selectedCategory === 'All' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">⭐</span>
              Essential Tools
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300 group flex flex-col h-full touch-feedback"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {tool.image_url && (
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                          <img 
                            src={tool.image_url} 
                            alt={tool.title}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {tool.title}
                        </h3>
                        <span className="inline-flex items-center text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 px-2 py-1 rounded-full">
                          <span className="mr-1">{getCategoryInfo(tool.category).emoji}</span>
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex-grow">
                    <p className="text-gray-100 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <a
                      href={tool.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg"
                    >
                      Get {tool.title.split(' ')[0]} ✨
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tools */}
        {(selectedCategory === 'All' ? regularTools : filteredTools).length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="text-3xl mr-3">{selectedCategory === 'All' ? '🛠️' : getCategoryInfo(selectedCategory).emoji}</span>
              {selectedCategory === 'All' ? 'All Tools' : `${selectedCategory} Tools`}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {(selectedCategory === 'All' ? regularTools : filteredTools).map((tool) => (
                <div
                  key={tool.id}
                  className="bg-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100/30 hover:shadow-xl hover:border-purple-200/50 transition-all duration-300 group flex flex-col h-full touch-feedback"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {tool.image_url && (
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                          <img 
                            src={tool.image_url} 
                            alt={tool.title}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {tool.title}
                        </h3>
                        <span className="inline-flex items-center text-xs font-medium text-purple-200 bg-purple-900/30 px-2 py-1 rounded-full">
                          <span className="mr-1">{getCategoryInfo(tool.category).emoji}</span>
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex-grow">
                    <p className="text-gray-100 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <a
                      href={tool.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block text-center bg-gradient-to-r from-slate-700 to-slate-600 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      Get {tool.title.split(' ')[0]} →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tools in this category yet</h3>
            <p className="text-gray-300">Check back soon as we're constantly adding new tools to our toolkit!</p>
          </div>
        )}
      </div>
    </DarkThemeBackground>
  )
}