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
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
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
    setExpandedCard(expandedCard === toolId ? null : toolId)
  }

  // Close modal when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedCard(null)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (expandedCard && (e.target as Element).classList.contains('modal-backdrop')) {
        setExpandedCard(null)
      }
    }

    if (expandedCard) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('click', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [expandedCard])

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

  // Simple preview card component
  const ToolCard = ({ tool, index, isFeatured = false }: { tool: AffiliateToolWithAccess, index: number, isFeatured?: boolean }) => {
    const categoryInfo = getCategoryInfo(tool.category)

    return (
      <div 
        className="group relative h-[340px] cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        onClick={() => toggleCard(tool.id)}
      >
        <div 
          className={`w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
            isFeatured 
              ? 'bg-gradient-to-br from-yellow-400/20 via-purple-800 to-purple-900 border-2 border-yellow-400/40' 
              : 'bg-gradient-to-br from-purple-800 via-purple-900 to-slate-800 border border-purple-500/30'
          }`}
        >
          {/* Featured Badge */}
          {isFeatured && (
            <div className="absolute top-3 right-3 z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">⭐</span>
              </div>
            </div>
          )}

          {/* Clean subtle overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 via-transparent to-transparent"></div>

          <div className="relative p-6 h-full flex flex-col justify-between">
            {/* Top Section */}
            <div className="text-center flex-1 flex flex-col">
              {/* Image */}
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
                {tool.description ? (
                  tool.description.length > 120 
                    ? `${tool.description.slice(0, 120)}...` 
                    : tool.description
                ) : 'A powerful tool to transform your workflow and boost productivity.'}
              </p>
            </div>

            {/* Bottom Section */}
            <div className="space-y-2">
              {/* Quick Action */}
              <button 
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={(e) => {
                  e.stopPropagation()
                  if (tool.affiliate_url) {
                    window.open(tool.affiliate_url, '_blank')
                  }
                }}
              >
                🚀 Try Now
              </button>
              
              {/* Expand hint */}
              <button className="w-full text-gray-400 hover:text-white text-xs transition-colors py-1">
                👆 Click for full details
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expanded modal component
  const ExpandedModal = ({ tool }: { tool: AffiliateToolWithAccess }) => {
    const categoryInfo = getCategoryInfo(tool.category)

    return (
      <div 
        className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg p-4"
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-purple-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-purple-500/30 animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-2xl p-3 flex items-center justify-center">
                {tool.image_url ? (
                  <img 
                    src={tool.image_url} 
                    alt={tool.title}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{categoryInfo.emoji}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">{tool.title}</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-2 bg-gradient-to-r ${categoryInfo.color} text-white`}>
                  <span className="mr-2">{categoryInfo.emoji}</span>
                  {tool.category}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-6">
              {/* Main Description */}
              <div>
                <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
                  <span className="mr-3">✨</span>
                  Why We Love This Tool
                </h3>
                <div className="text-gray-200 text-base leading-relaxed space-y-4">
                  {tool.description ? (
                    tool.description.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="leading-relaxed">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p>A comprehensive tool designed to streamline your workflow and increase productivity. This powerful solution has been battle-tested and proven to deliver results for businesses of all sizes.</p>
                  )}
                </div>
              </div>

              {/* Standout Features */}
              {(tool as any).standout_features && (tool as any).standout_features.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                    <span className="mr-2">🚀</span>
                    Standout Features
                  </h4>
                  <ul className="space-y-2">
                    {(tool as any).standout_features.map((feature: string, index: number) => (
                      <li key={index} className="text-gray-200 text-sm flex items-start">
                        <span className="text-purple-400 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Benefits */}
              {(tool as any).key_benefits && (tool as any).key_benefits.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                    <span className="mr-2">💎</span>
                    Key Benefits
                  </h4>
                  <ul className="space-y-2">
                    {(tool as any).key_benefits.map((benefit: string, index: number) => (
                      <li key={index} className="text-gray-200 text-sm flex items-start">
                        <span className="text-blue-400 mr-2">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => {
                  if (tool.affiliate_url) {
                    window.open(tool.affiliate_url, '_blank')
                  }
                }}
              >
                🚀 Get Started Now
              </button>
              <button 
                onClick={() => setExpandedCard(null)}
                className="px-8 py-4 border border-slate-600 text-gray-300 hover:text-white hover:border-slate-500 rounded-xl text-lg transition-colors"
              >
                Close
              </button>
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

      {/* Expanded Modal */}
      {expandedCard && (
        <ExpandedModal tool={tools.find(t => t.id === expandedCard)!} />
      )}
    </DarkThemeBackground>
  )
}