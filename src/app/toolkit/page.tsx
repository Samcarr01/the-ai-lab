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
      
      // If no tools, add sample data for demo
      if (toolsData.length === 0) {
        const sampleTools = [
          {
            id: 1,
            title: 'N8N Automation Platform',
            description: 'The workflow automation tool that transformed how we handle repetitive tasks. N8N\'s visual interface lets you connect 300+ services without writing code. We\'ve automated everything from lead processing to content distribution, saving 15+ hours per week.',
            category: 'Automation',
            affiliate_url: 'https://n8n.io',
            image_url: undefined,
            is_featured: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            hasAccess: true
          }
        ]
        setTools(sampleTools)
        setCategories(['Automation'])
      }
      
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
      <div className="group relative h-[420px]" style={{ perspective: '1200px' }}>
        <div 
          className="relative w-full h-full cursor-pointer hover:scale-105"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'all 0.8s cubic-bezier(0.23, 1, 0.320, 1)'
          }}
          onClick={() => toggleCard(tool.id)}
        >
          {/* FRONT CARD */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group-hover:shadow-2xl ${
              isFeatured 
                ? 'bg-gradient-to-br from-yellow-400/10 via-purple-900 to-slate-900 border-2 border-yellow-400/30' 
                : 'bg-gradient-to-br from-purple-900/50 via-slate-800 to-slate-900 border border-slate-600/50'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            
            {/* Featured Badge - Only on front card */}
            {isFeatured && (
              <div className="absolute top-3 right-3 z-20">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">⭐</span>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            <div className="relative p-6 h-full flex flex-col justify-between">
              {/* Top Section */}
              <div className="text-center flex-1 flex flex-col">
                {/* Image - Show placeholder if no image */}
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-xl bg-white/95 shadow-lg p-2 flex items-center justify-center backdrop-blur-sm">
                    {tool.image_url ? (
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center text-xl">
                        {categoryInfo.emoji}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-2">
                  {tool.title || 'Sample Tool'}
                </h3>

                {/* Category */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-gradient-to-r ${categoryInfo.color} text-white shadow-md`}>
                  <span className="mr-1">{categoryInfo.emoji}</span>
                  {tool.category || 'Automation'}
                </div>

                {/* Description Preview */}
                <p className="text-gray-300 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">
                  {tool.description ? `${tool.description.slice(0, 100)}...` : 'A powerful tool to transform your workflow and boost productivity.'}
                </p>
              </div>

              {/* Bottom Section */}
              <div className="space-y-2">
                {/* Primary CTA */}
                <button 
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (tool.affiliate_url) {
                      window.open(tool.affiliate_url, '_blank')
                    } else {
                      console.log('No affiliate URL provided')
                    }
                  }}
                >
                  🚀 Try {tool.title || 'This Tool'}
                </button>
                
                {/* Secondary Action */}
                <button className="w-full text-gray-400 hover:text-white text-xs transition-colors py-1">
                  👆 Click card for details
                </button>
              </div>
            </div>
          </div>

          {/* BACK CARD */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900 border border-purple-500/50 shadow-xl overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="p-6 h-full flex flex-col">
              {/* Header with only X button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-xl p-2 flex items-center justify-center">
                    {tool.image_url ? (
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <span className="text-sm">{categoryInfo.emoji}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white line-clamp-1">{tool.title || 'Sample Tool'}</h4>
                    <p className="text-xs text-purple-300">{tool.category || 'Automation'}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="w-7 h-7 rounded-full bg-slate-700/80 text-gray-300 hover:text-white hover:bg-slate-600 text-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 mb-4 overflow-hidden">
                <div className="mb-3">
                  <h5 className="text-purple-300 font-semibold mb-2 flex items-center text-sm">
                    <span className="mr-2">✨</span>
                    Why We Love This Tool
                  </h5>
                  <p className="text-gray-200 text-sm leading-relaxed overflow-hidden">
                    {tool.description || 'A comprehensive tool designed to streamline your workflow and increase productivity. This powerful solution has been battle-tested and proven to deliver results for businesses of all sizes.'}
                  </p>
                </div>
              </div>

              {/* Single Action Button */}
              <div>
                <button 
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (tool.affiliate_url) {
                      window.open(tool.affiliate_url, '_blank')
                    } else {
                      console.log('No affiliate URL provided')
                    }
                  }}
                >
                  🚀 Get Started Now
                </button>
              </div>
            </div>
          </div>
        </div>

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