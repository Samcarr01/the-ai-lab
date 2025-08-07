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
            <p className="text-white font-medium text-lg">Loading our amazing toolkit...</p>
          </div>
        </div>
      </DarkThemeBackground>
    )
  }

  const ToolCard = ({ tool, index, isFeatured = false }: { tool: AffiliateToolWithAccess, index: number, isFeatured?: boolean }) => {
    const isFlipped = flippedCards.has(tool.id)
    const categoryInfo = getCategoryInfo(tool.category)

    return (
      <div className="relative h-80" style={{ perspective: '1000px' }}>
        <div 
          className={`tool-card relative w-full h-full cursor-pointer transition-transform duration-700 ease-in-out ${
            isFlipped ? 'flipped' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
          onClick={() => toggleCard(tool.id)}
        >
          {/* FRONT CARD */}
          <div className="card-face card-front absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 shadow-lg overflow-hidden">
            {isFeatured && (
              <div className="absolute top-2 right-2 z-10">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">⭐</span>
                </div>
              </div>
            )}

            <div className="p-6 h-full flex flex-col items-center justify-center text-center">
              {/* Image */}
              {tool.image_url && (
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-lg bg-white shadow-md p-2 flex items-center justify-center">
                    <img 
                      src={tool.image_url} 
                      alt={tool.title}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-3 leading-tight">
                {tool.title}
              </h3>

              {/* Category */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 bg-gradient-to-r ${categoryInfo.color} text-white`}>
                <span className="mr-1">{categoryInfo.emoji}</span>
                {tool.category}
              </div>

              {/* Short description */}
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {tool.description.slice(0, 80)}...
              </p>

              {/* CTA */}
              <button 
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg text-sm hover:shadow-lg transition-shadow"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(tool.affiliate_url, '_blank')
                }}
              >
                Get Access →
              </button>

              <p className="text-xs text-gray-500 mt-3">Click to see details</p>
            </div>
          </div>

          {/* BACK CARD */}
          <div className="card-face card-back absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-500 shadow-lg overflow-hidden">
            <div className="p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {tool.image_url && (
                    <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">{tool.title}</h4>
                    <p className="text-xs text-purple-300">{tool.category}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="w-6 h-6 rounded-full bg-slate-700 text-gray-300 hover:text-white text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="text-gray-200 text-sm leading-relaxed mb-4">
                  {tool.description}
                </p>
              </div>

              {/* CTA */}
              <button 
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg text-sm hover:shadow-lg transition-shadow"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(tool.affiliate_url, '_blank')
                }}
              >
                Visit Tool →
              </button>
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
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Our Toolkit ✨
          </h1>
          <p className="text-gray-300 text-lg mb-2">
            The battle-tested tools that transformed our business.
          </p>
          <p className="text-gray-400">
            These aren't recommendations—they're our daily drivers.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center items-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{tools.length}</div>
              <div className="text-sm text-gray-400">Curated Tools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{categories.length}</div>
              <div className="text-sm text-gray-400">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">100%</div>
              <div className="text-sm text-gray-400">Battle-Tested</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === 'All'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            ✨ All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {getCategoryInfo(category).emoji} {category}
            </button>
          ))}
        </div>

        {/* Featured Tools Section */}
        {featuredTools.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-8">
              ⭐ Game Changers
            </h2>
            <p className="text-center text-gray-400 mb-8">The tools that completely transformed how we work</p>
            
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
            <h2 className="text-2xl font-bold text-center text-white mb-8">
              Essential Arsenal
            </h2>
            <p className="text-center text-gray-400 mb-8">More incredible tools that power our workflow</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {regularTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tools found</h3>
            <p className="text-gray-400">Try selecting a different category</p>
          </div>
        )}
      </main>
    </DarkThemeBackground>
  )
}