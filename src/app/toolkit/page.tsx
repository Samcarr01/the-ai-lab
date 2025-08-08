'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { affiliateToolsService, type AffiliateToolWithAccess } from '@/lib/affiliate-tools'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import SmartNavigation from '@/components/SmartNavigation'
import { AffiliateCard } from '@/components/AffiliateCard'
import { AffiliateModal } from '@/components/AffiliateModal'
import { AffiliateTool } from '@/types/affiliate'

export default function ToolkitPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [tools, setTools] = useState<AffiliateToolWithAccess[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<AffiliateTool | null>(null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

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
            rating: 4.8,
            price: 'Free',
            affiliate_url: 'https://n8n.io',
            image_url: undefined,
            is_featured: true,
            key_benefits: [
              'Saves 15+ hours per week with intelligent automation',
              'Connect 300+ services without coding',
              'Visual workflow builder for complex processes',
              'Self-hosted option for complete data control'
            ],
            why_we_love_it: [
              'Zero learning curve with drag-and-drop interface',
              'Robust automation that handles edge cases gracefully',
              'Active community with thousands of workflow templates',
              'Enterprise-grade security with self-hosting options'
            ],
            standout_features: [
              'Visual workflow editor with 300+ integrations',
              'Advanced error handling and retry mechanisms',
              'Real-time execution monitoring and debugging',
              'Custom JavaScript functions for complex logic'
            ],
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

  const handleExpand = (tool: AffiliateTool) => {
    setSelectedTool(tool)
    setExpandedCardId(String(tool.id))
  }

  const handleClose = () => {
    setSelectedTool(null)
    setExpandedCardId(null)
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
                <AffiliateCard 
                  key={tool.id} 
                  tool={tool as AffiliateTool} 
                  onExpand={handleExpand}
                  isExpanded={expandedCardId === String(tool.id)}
                  index={index} 
                  isFeatured={true} 
                />
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
                <AffiliateCard 
                  key={tool.id} 
                  tool={tool as AffiliateTool} 
                  onExpand={handleExpand}
                  isExpanded={expandedCardId === String(tool.id)}
                  index={index} 
                  isFeatured={false} 
                />
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

      {/* Affiliate Modal */}
      <AffiliateModal
        tool={selectedTool}
        isOpen={!!selectedTool}
        onClose={handleClose}
      />
    </DarkThemeBackground>
  )
}