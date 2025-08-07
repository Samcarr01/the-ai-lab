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
        }, index * 200)
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
    const isAnimated = animatedCards.has(index)
    const categoryInfo = getCategoryInfo(tool.category)

    return (
      <div 
        className={`tool-card-container transition-all duration-1000 transform ${
          isAnimated ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
        }`}
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`tool-card w-full h-96 relative cursor-pointer transition-transform duration-700 ease-in-out ${
            isFlipped ? 'flipped' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
          }}
          onClick={() => toggleCard(tool.id)}
        >
          {/* FRONT SIDE */}
          <div className={`card-face card-front absolute inset-0 w-full h-full rounded-3xl overflow-hidden ${
            isFeatured 
              ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-yellow-400/50 shadow-2xl shadow-yellow-400/20' 
              : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-600/50 shadow-2xl'
          } backdrop-blur-xl`}>
            
            {/* Floating background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Featured Badge */}
            {isFeatured && (
              <div className="absolute top-4 right-4 z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                  <span className="text-white text-lg font-bold">⭐</span>
                </div>
              </div>
            )}

            <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
              {/* PERFECTLY SIZED Image (only if uploaded) */}
              {tool.image_url && (
                <div className="mb-8 relative group">
                  {/* Glowing border effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative w-40 h-40 rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-2xl p-4 flex items-center justify-center transform transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 border-4 border-white/20">
                    <img 
                      src={tool.image_url} 
                      alt={tool.title}
                      className="w-32 h-32 object-contain rounded-2xl drop-shadow-lg"
                      style={{
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* BIG BOLD Title */}
              <h3 className="text-3xl font-black text-white mb-4 leading-tight max-w-xs">
                {tool.title}
              </h3>

              {/* Category Badge */}
              <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold mb-6 bg-gradient-to-r ${categoryInfo.color} text-white shadow-xl transform hover:scale-105 transition-all duration-300`}>
                <span className="mr-2 text-lg">{categoryInfo.emoji}</span>
                {tool.category}
              </div>

              {/* Compelling Hook */}
              <p className="text-gray-200 text-lg mb-8 max-w-sm leading-relaxed font-medium">
                {tool.description.slice(0, 100)}...
              </p>

              {/* Epic Discover Button */}
              <div className="relative group">
                <button className="relative px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-purple-500/50 animate-gradient-x overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-3">
                    <span className="text-2xl">✨</span>
                    <span>Discover Magic</span>
                    <div className="transform group-hover:translate-x-2 transition-transform duration-300 text-xl">→</div>
                  </div>
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-4 opacity-80 animate-pulse">Click to reveal the secrets</p>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="card-face card-back absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-purple-400/40 shadow-2xl overflow-hidden">
            
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 via-transparent to-pink-400/30"></div>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-40 h-40 border border-purple-400/20 rounded-full animate-pulse"
                  style={{
                    right: `${-20 + i * -25}%`,
                    top: `${20 + i * 15}%`,
                    animationDelay: `${i * 0.8}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative p-8 h-full flex flex-col">
              {/* Back Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {tool.image_url ? (
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <img 
                        src={tool.image_url} 
                        alt={tool.title}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-2xl">{categoryInfo.emoji}</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-white">{tool.title}</h4>
                    <p className="text-purple-300 font-medium">{tool.category}</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="w-10 h-10 rounded-full bg-slate-700/50 text-gray-300 hover:text-white hover:bg-slate-600/80 transition-all duration-200 flex items-center justify-center text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Detailed Content */}
              <div className="flex-1 space-y-6">
                <div>
                  <h5 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
                    <span className="mr-2 text-xl">🎯</span>
                    Why This Tool is Pure Gold
                  </h5>
                  <p className="text-gray-100 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div>
                  <h5 className="text-lg font-bold text-pink-300 mb-3 flex items-center">
                    <span className="mr-2 text-xl">⚡</span>
                    Perfect For You If
                  </h5>
                  <ul className="text-gray-200 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-3 text-green-400 text-lg mt-1">•</span>
                      <span>You want to {tool.category.toLowerCase()} like a pro</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-green-400 text-lg mt-1">•</span>
                      <span>You value tools that actually work</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-green-400 text-lg mt-1">•</span>
                      <span>You want to level up your entire workflow</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6 border-t border-slate-700">
                <a
                  href={tool.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  🚀 Get {tool.title.split(' ')[0]} Now
                </a>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCard(tool.id)
                  }}
                  className="px-6 py-4 bg-slate-700/50 text-gray-300 rounded-2xl hover:bg-slate-600/70 hover:text-white transition-all duration-300 font-medium"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
        {/* EPIC Header */}
        <div className="text-center mb-16 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 bg-purple-400/20 rounded-full animate-float`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${4 + Math.random() * 3}s`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-transparent bg-gradient-to-r from-purple-400 via-pink-400 via-purple-400 to-pink-400 bg-clip-text mb-6 animate-gradient-x leading-tight">
              Our Toolkit ✨
            </h1>
            <p className="text-xl sm:text-2xl text-gray-100 max-w-4xl mx-auto leading-relaxed font-medium">
              The <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-bold">battle-tested tools</span> that transformed our business.
              <br className="hidden sm:block" />
              These aren't recommendations—they're our <span className="text-yellow-400 font-bold">daily drivers</span>.
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center space-x-6 mt-10">
            {[
              { number: tools.length, label: 'Curated Tools', icon: '🛠️' },
              { number: categories.length - 1, label: 'Categories', icon: '📂' },
              { number: '100%', label: 'Battle-Tested', icon: '⚡' }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30 transform hover:scale-105 transition-all duration-300">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-black text-white">{stat.number}</div>
                <div className="text-sm text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-16">
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-purple-100/30">
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => {
                  const categoryInfo = category === 'All' 
                    ? { emoji: '🎯', color: 'from-purple-600 to-pink-600' }
                    : getCategoryInfo(category)
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`group relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === category
                          ? `bg-gradient-to-r ${categoryInfo.color} text-white shadow-2xl scale-105 border-2 border-white/30`
                          : 'bg-slate-700/50 text-gray-100 border border-gray-600/50 hover:border-purple-300/60 hover:text-white hover:bg-slate-600/70'
                      } backdrop-blur-sm`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xl transform group-hover:scale-125 transition-transform duration-300">
                          {categoryInfo.emoji}
                        </span>
                        <span>{category}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Featured Tools */}
        {featuredTools.length > 0 && selectedCategory === 'All' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text mb-4 flex items-center justify-center">
                <span className="text-5xl mr-4 animate-pulse">⭐</span>
                Game Changers
                <span className="text-5xl ml-4 animate-pulse">⭐</span>
              </h2>
              <p className="text-xl text-gray-300 font-medium">The tools that completely transformed how we work</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} isFeatured={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Tools */}
        {(selectedCategory === 'All' ? regularTools : filteredTools).length > 0 && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-4 flex items-center justify-center">
                <span className="text-5xl mr-4">
                  {selectedCategory === 'All' ? '🛠️' : getCategoryInfo(selectedCategory).emoji}
                </span>
                {selectedCategory === 'All' ? 'Complete Arsenal' : `${selectedCategory} Mastery`}
              </h2>
              <p className="text-xl text-gray-300 font-medium">
                {selectedCategory === 'All' 
                  ? 'Every tool in our carefully curated collection'
                  : `Master ${selectedCategory.toLowerCase()} with these power tools`
                }
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(selectedCategory === 'All' ? regularTools : filteredTools).map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={featuredTools.length + index} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <div className="text-9xl mb-8 animate-bounce">🛠️</div>
            <h3 className="text-3xl font-bold text-white mb-4">No tools in this category yet</h3>
            <p className="text-xl text-gray-300 mb-8">We're constantly adding new weapons to our arsenal!</p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              View All Tools
            </button>
          </div>
        )}
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        .tool-card-container {
          perspective: 1200px;
        }
        
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
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-15px) translateX(10px) rotate(90deg); 
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-8px) translateX(-5px) rotate(180deg); 
            opacity: 0.5;
          }
          75% { 
            transform: translateY(-20px) translateX(-10px) rotate(270deg); 
            opacity: 0.9;
          }
        }
        
        @keyframes gradient-x {
          0%, 100% { 
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }
        
        .animate-float { 
          animation: float 4s ease-in-out infinite; 
        }
        
        .animate-gradient-x { 
          animation: gradient-x 3s ease infinite;
          background-size: 400% 400%;
        }
      `}</style>
    </DarkThemeBackground>
  )
}