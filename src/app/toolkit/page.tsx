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
  const [animatedCards, setAnimatedCards] = useState<Set<number>>(new Set())
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
      
      // Staggered entrance animation
      toolsData.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedCards(prev => {
            const newSet = new Set(prev)
            newSet.add(index)
            return newSet
          })
        }, index * 150)
      })
      
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
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
            </div>
            <p className="text-white font-medium">Loading our amazing toolkit...</p>
          </div>
        </div>
      </DarkThemeBackground>
    )
  }

  const ToolCard = ({ tool, index, isFeatured = false }: { tool: AffiliateToolWithAccess, index: number, isFeatured?: boolean }) => {
    const isFlipped = flippedCards.has(tool.id)
    const isAnimated = animatedCards.has(index)
    const categoryInfo = getCategoryInfo(tool.category)

    return (
      <div 
        className={`relative transition-all duration-700 transform-gpu perspective-1000 ${
          isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        <div
          className={`relative w-full h-80 transition-all duration-700 transform-gpu cursor-pointer group ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
          }}
          onClick={() => toggleCard(tool.id)}
        >
          {/* FRONT SIDE - Hero Display */}
          <div 
            className={`absolute inset-0 w-full h-full rounded-3xl backface-hidden ${
              isFeatured 
                ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-400/30' 
                : 'bg-slate-800/60 border border-slate-700/50'
            } backdrop-blur-lg shadow-2xl group-hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden`}
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float-${i % 3 + 1}`}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 12}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
              {/* Large Logo */}
              {tool.image_url && (
                <div className="mb-6 relative">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                    isFeatured ? 'bg-gradient-to-br from-white to-purple-50' : 'bg-white'
                  }`}>
                    <img 
                      src={tool.image_url} 
                      alt={tool.title}
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  {isFeatured && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-white text-xs">⭐</span>
                    </div>
                  )}
                </div>
              )}

              {/* Big Title */}
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                {tool.title}
              </h3>

              {/* Category Badge */}
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 bg-gradient-to-r ${categoryInfo.color} text-white shadow-lg`}>
                <span className="mr-2 text-base">{categoryInfo.emoji}</span>
                {tool.category}
              </div>

              {/* Hook Line */}
              <p className="text-gray-300 text-lg mb-6 max-w-xs leading-relaxed">
                {tool.description.slice(0, 80)}...
              </p>

              {/* Discover Button */}
              <button className="group/btn relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <span>✨ Discover Why</span>
                  <div className="transform group-hover/btn:translate-x-1 transition-transform duration-300">→</div>
                </div>
              </button>

              <p className="text-xs text-gray-400 mt-3 opacity-70">Click to reveal the details</p>
            </div>
          </div>

          {/* BACK SIDE - Detailed Information */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-lg border border-purple-400/30 shadow-2xl rotate-y-180 backface-hidden overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 via-transparent to-pink-400/20"></div>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-32 h-32 border border-purple-400/20 rounded-full animate-pulse"
                  style={{
                    right: `${-10 + i * -15}%`,
                    top: `${10 + i * 20}%`,
                    animationDelay: `${i * 0.7}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative p-6 h-full flex flex-col">
              {/* Back Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {tool.image_url && (
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-white">{tool.title}</h4>
                    <p className="text-sm text-purple-300">{tool.category}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="w-8 h-8 rounded-full bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Detailed Description */}
              <div className="flex-1 space-y-4">
                <div>
                  <h5 className="text-sm font-semibold text-purple-300 mb-2 flex items-center">
                    <span className="mr-2">🎯</span>
                    Why This Tool Rocks
                  </h5>
                  <p className="text-gray-100 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-pink-300 mb-2 flex items-center">
                    <span className="mr-2">⚡</span>
                    Perfect For
                  </h5>
                  <ul className="text-gray-200 text-sm space-y-1">
                    <li className="flex items-center">
                      <span className="mr-2 text-green-400">•</span>
                      Teams looking to {tool.category.toLowerCase()} efficiently
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-green-400">•</span>
                      Professionals who value quality tools
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-green-400">•</span>
                      Anyone wanting to level up their workflow
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-slate-700">
                <a
                  href={tool.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  🚀 Get {tool.title.split(' ')[0]}
                </a>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="px-4 py-3 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-600/50 hover:text-white transition-all duration-200 text-sm"
                >
                  ← Back
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
      <SmartNavigation user={user} currentPage="toolkit" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-4 sm:pb-8">
        {/* Epic Header Section */}
        <div className="text-center mb-12 sm:mb-16 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-purple-400/20 rounded-full animate-float-${i % 3 + 1}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text mb-4 sm:mb-6 animate-gradient-x">
              Our Toolkit ✨
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-100 max-w-4xl mx-auto px-2 sm:px-0 leading-relaxed">
              The <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold">battle-tested tools</span> that power our AI workflows. 
              <br className="hidden sm:block" />
              These aren't just recommendations—they're the exact tools we use daily.
            </p>
          </div>

          {/* Floating stats */}
          <div className="flex justify-center space-x-8 mt-8 text-center">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20">
              <div className="text-2xl font-bold text-white">{tools.length}</div>
              <div className="text-sm text-gray-300">Curated Tools</div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20">
              <div className="text-2xl font-bold text-white">{categories.length - 1}</div>
              <div className="text-sm text-gray-300">Categories</div>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-gray-300">Tested</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-12 sm:mb-16">
            <div className="bg-slate-800/40 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-purple-100/20">
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => {
                  const categoryInfo = category === 'All' 
                    ? { emoji: '🎯', color: 'from-purple-600 to-pink-600' }
                    : getCategoryInfo(category)
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`group relative px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === category
                          ? `bg-gradient-to-r ${categoryInfo.color} text-white shadow-2xl scale-105 border-2 border-white/20`
                          : 'bg-slate-700/50 text-gray-100 border border-gray-600/50 hover:border-purple-300/60 hover:text-white hover:bg-slate-600/70'
                      } backdrop-blur-sm`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg transform group-hover:scale-110 transition-transform duration-200">
                          {categoryInfo.emoji}
                        </span>
                        <span>{category}</span>
                      </div>
                      {selectedCategory === category && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-white/10 pointer-events-none"></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Featured Tools */}
        {featuredTools.length > 0 && selectedCategory === 'All' && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text mb-3 flex items-center justify-center">
                <span className="text-4xl mr-3 animate-pulse">⭐</span>
                Essential Powerhouses
                <span className="text-4xl ml-3 animate-pulse">⭐</span>
              </h2>
              <p className="text-gray-300 text-lg">Our most impactful tools that transformed how we work</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} isFeatured={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Tools */}
        {(selectedCategory === 'All' ? regularTools : filteredTools).length > 0 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center">
                <span className="text-4xl mr-3">
                  {selectedCategory === 'All' ? '🛠️' : getCategoryInfo(selectedCategory).emoji}
                </span>
                {selectedCategory === 'All' ? 'Complete Arsenal' : `${selectedCategory} Collection`}
              </h2>
              <p className="text-gray-300 text-lg">
                {selectedCategory === 'All' 
                  ? 'Every tool in our carefully curated collection'
                  : `Specialized tools for ${selectedCategory.toLowerCase()}`
                }
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(selectedCategory === 'All' ? regularTools : filteredTools).map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={featuredTools.length + index} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-16">
            <div className="relative">
              <div className="text-8xl mb-6 animate-bounce">🛠️</div>
              <h3 className="text-2xl font-semibold text-white mb-3">No tools in this category yet</h3>
              <p className="text-gray-300 text-lg mb-8">We're constantly adding new tools to our arsenal!</p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                View All Tools
              </button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-3xl p-8 border border-purple-100/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Found the perfect tool? 🎯</h3>
            <p className="text-gray-200 mb-6">
              These tools have saved us hundreds of hours and thousands of dollars. 
              Each one is hand-picked and battle-tested in real projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                💬 Questions? Get in Touch
              </Link>
              <Link
                href="/blog"
                className="px-8 py-3 bg-slate-700/50 text-white border border-slate-600 rounded-2xl font-semibold hover:bg-slate-600/50 hover:scale-105 transition-all duration-300"
              >
                📖 Read Our Workflows
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(90deg); }
          50% { transform: translateY(-5px) rotate(180deg); }
          75% { transform: translateY(-15px) rotate(270deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(120deg); }
          66% { transform: translateY(-12px) rotate(240deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float-1 { animation: float-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 4s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 5s ease-in-out infinite; }
        .animate-gradient-x { 
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </DarkThemeBackground>
  )
}