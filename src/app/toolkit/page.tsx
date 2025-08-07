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
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
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
      // Filter out 'All' from categories to prevent duplicate
      setCategories(categoriesData.filter(cat => cat !== 'All'))
      
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

  const toggleCard = (toolId: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <DarkThemeBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="w-20 h-20 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
            </div>
            <p className="text-white font-medium text-lg">Loading our toolkit...</p>
          </div>
        </div>
      </DarkThemeBackground>
    )
  }

  const ToolCard = ({ tool, index, isFeatured = false }: { tool: AffiliateToolWithAccess, index: number, isFeatured?: boolean }) => {
    const isFlipped = flippedCards.has(tool.id)
    const categoryInfo = getCategoryInfo(tool.category)

    return (
      <div className="group relative h-96" style={{ perspective: '1000px' }}>
        <div 
          className={`tool-card relative w-full h-full cursor-pointer transition-transform duration-700 ease-in-out ${
            isFlipped ? 'flipped' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => toggleCard(tool.id)}
        >
          {/* FRONT CARD */}
          <div className={`card-face card-front absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group-hover:shadow-2xl ${
            isFeatured 
              ? 'bg-gradient-to-br from-yellow-400/10 via-purple-900 to-slate-900 border-2 border-yellow-400/30' 
              : 'bg-gradient-to-br from-purple-900/50 via-slate-800 to-slate-900 border border-slate-600/50'
          }`}>
            
            {/* Featured Badge */}
            {isFeatured && (
              <div className="absolute top-3 right-3 z-10">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">⭐</span>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            <div className="relative p-8 h-full flex flex-col justify-between">
              {/* Top Section */}
              <div className="text-center">
                {/* Image */}
                {tool.image_url && (
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/95 shadow-lg p-3 flex items-center justify-center backdrop-blur-sm">
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-14 h-14 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                  {tool.title}
                </h3>

                {/* Category */}
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold mb-4 bg-gradient-to-r ${categoryInfo.color} text-white shadow-md`}>
                  <span className="mr-2">{categoryInfo.emoji}</span>
                  {tool.category}
                </div>

                {/* Description Preview */}
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  {tool.description.slice(0, 120)}...
                </p>
              </div>

              {/* Bottom Section */}
              <div className="space-y-3">
                {/* Primary CTA */}
                <button 
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(tool.affiliate_url, '_blank')
                  }}
                >
                  🚀 Try {tool.title}
                </button>
                
                {/* Secondary Action */}
                <button className="w-full text-gray-400 hover:text-white text-xs transition-colors">
                  👆 Click card for details
                </button>
              </div>
            </div>
          </div>

          {/* BACK CARD */}
          <div className="card-face card-back absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900 border border-purple-500/50 shadow-xl overflow-hidden">
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {tool.image_url && (
                    <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center">
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-white">{tool.title}</h4>
                    <p className="text-sm text-purple-300">{tool.category}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="w-8 h-8 rounded-full bg-slate-700 text-gray-300 hover:text-white hover:bg-slate-600 text-sm flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 mb-6">
                <div className="mb-4">
                  <h5 className="text-purple-300 font-semibold mb-2 flex items-center">
                    <span className="mr-2">✨</span>
                    Why We Love This Tool
                  </h5>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(tool.affiliate_url, '_blank')
                  }}
                >
                  🚀 Get Started Now
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="w-full px-4 py-2 border border-slate-600 text-gray-300 hover:text-white hover:border-slate-500 rounded-lg text-sm transition-colors"
                >
                  ← Back to Overview
                </button>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .tool-card {
            transform-style: preserve-3d;
          }
          .tool-card.flipped {
            transform: rotateY(180deg);
          }
          .card-face {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          .card-front {
            transform: rotateY(0deg);
          }
          .card-back {
            transform: rotateY(180deg);
          }
        `}</style>
      </div>
    )
  }

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-6">
            Our Toolkit ✨
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            The battle-tested tools that transformed our business.
          </p>
          <p className="text-gray-400 mb-8">
            These aren't recommendations—they're our daily drivers.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center items-center space-x-12 mt-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{tools.length}</div>
              <div className="text-gray-400">Curated Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">{categories.length}</div>
              <div className="text-gray-400">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-gray-400">Battle-Tested</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
              selectedCategory === 'All'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white border border-slate-600'
            }`}
          >
            ✨ All Tools
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white border border-slate-600'
              }`}
            >
              {getCategoryInfo(category).emoji} {category}
            </button>
          ))}
        </div>

        {/* Featured Tools Section */}
        {featuredTools.length > 0 && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
                ⭐ Game Changers
              </h2>
              <p className="text-gray-400 text-lg">The tools that completely transformed how we work</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {featuredTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} isFeatured={true} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Tools */}
        {regularTools.length > 0 && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Essential Arsenal
              </h2>
              <p className="text-gray-400 text-lg">More incredible tools that power our workflow</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {regularTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-4">No tools found</h3>
            <p className="text-gray-400 text-lg">Try selecting a different category</p>
            <button 
              onClick={() => setSelectedCategory('All')}
              className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              View All Tools
            </button>
          </div>
        )}
      </main>
    </DarkThemeBackground>
  )
}