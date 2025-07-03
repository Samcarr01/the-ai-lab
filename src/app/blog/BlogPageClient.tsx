'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { blogService, type BlogPost } from '@/lib/blog'
import { useAdmin } from '@/contexts/AdminContext'
import SmartNavigation from '@/components/SmartNavigation'
import GradientBackground from '@/components/NetworkBackground'

export default function BlogPageClient() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  const { adminViewMode, getEffectiveUser } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load blog posts and categories first (always accessible - public content)
        const [posts, blogCategories] = await Promise.all([
          blogService.getAllPosts(),
          blogService.getCategories()
        ])
        
        setBlogPosts(posts)
        setCategories(['All', ...blogCategories])
        
        // Try to get user info (optional - for better UX if logged in)
        try {
          const { user: authUser, error } = await auth.getUser()
          
          if (!error && authUser) {
            // Fetch user profile from our database
            let userProfile = await userService.getProfile(authUser.id)
            
            // If no profile exists, create one (for existing auth users)
            if (!userProfile) {
              userProfile = await userService.createProfile(authUser.id, authUser.email || '')
            }
            
            if (userProfile) {
              setUser(userProfile)
            }
          }
          // If not logged in, that's fine - blog is public
        } catch (authErr) {
          console.log('User not authenticated, showing public blog content')
          // Not an error - blog is public
        }
      } catch (err) {
        console.error('Error loading blog data:', err)
        // Still don't redirect - show what we can
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Get effective user for display (applies global admin toggle)
  const effectiveUser = getEffectiveUser(user)

  // Filter blog posts based on search and category
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.meta_description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white relative">
      {/* Animated Background */}
      <GradientBackground />
      
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
              {effectiveUser ? (
                // Logged in navigation
                <>
                  <nav className="flex items-center space-x-6">
                    <Link
                      href="/dashboard"
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/gpts"
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                    >
                      GPTs
                    </Link>
                    <Link
                      href="/documents"
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                    >
                      Playbooks
                    </Link>
                    <Link
                      href="/blog"
                      className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      Blog
                    </Link>
                    {user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin' && (
                      <Link
                        href="/admin"
                        className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                      >
                        Admin
                      </Link>
                    )}
                  </nav>
                  
                  {/* User Profile Section */}
                  <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                    <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1 ${
                      user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : effectiveUser && effectiveUser.is_pro 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin' ? (
                        <>
                          <span>🔧</span>
                          <span>Admin</span>
                        </>
                      ) : (
                        <>
                          <span>{effectiveUser && effectiveUser.is_pro ? '✨' : '🆓'}</span>
                          <span>{effectiveUser && effectiveUser.is_pro ? 'Pro' : 'Free'}</span>
                        </>
                      )}
                    </div>
                    {/* Admin Toggle Button (only for admin) */}
                    {user && user.email === 'samcarr1232@gmail.com' && (
                      <button
                        onClick={toggleAdminView}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                          adminViewMode === 'admin' 
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                        title={`Currently viewing as: ${adminViewMode === 'admin' ? 'Admin' : 'Free User'}`}
                      >
                        {adminViewMode === 'admin' ? '👤 View as Free' : '🔧 View as Admin'}
                      </button>
                    )}
                    
                    {effectiveUser && !effectiveUser.is_pro && effectiveUser.email !== 'samcarr1232@gmail.com' && (
                      <Link
                        href="/upgrade"
                        className="text-sm gradient-purple text-white px-4 py-2 rounded-full font-medium button-hover"
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                // Public navigation
                <>
                  <nav className="flex items-center space-x-6">
                    <Link
                      href="/"
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                    >
                      Home
                    </Link>
                    <Link
                      href="/blog"
                      className="text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                    >
                      Blog
                    </Link>
                  </nav>
                  
                  {/* Auth Actions */}
                  <div className="flex items-center space-x-3">
                    <Link
                      href="/login"
                      className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm gradient-purple text-white px-4 py-2 rounded-full font-medium button-hover"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            {effectiveUser ? (
              <InternalMobileNavigation 
                userEmail={effectiveUser.email}
                isPro={effectiveUser.is_pro}
                showAdminLink={user && user.email === 'samcarr1232@gmail.com' && adminViewMode === 'admin'}
              />
            ) : (
              // Public mobile navigation
              <div className="md:hidden">
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-purple-600 transition-colors font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm gradient-purple text-white px-3 py-2 rounded-full font-medium button-hover"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI Tools & Strategies 🧠
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {effectiveUser ? (
              "Discover powerful AI tools, proven strategies, and actionable insights to boost your productivity. Explore our latest findings and tutorials."
            ) : (
              "Free insights into AI tools, proven strategies, and actionable tutorials. Learn how to leverage AI effectively in your work. Sign up to access our full collection of GPTs and Playbooks."
            )}
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100/50">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search articles..."
                    className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      category === selectedCategory
                        ? 'gradient-purple text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blog Posts or Empty State */}
        {filteredPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-xs font-medium bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {post.read_time} min read
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {post.meta_description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <span className="text-purple-600 group-hover:text-purple-700 font-medium">
                      Read article →
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : blogPosts.length === 0 ? (
          /* Empty state when no posts exist */
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Content Coming Soon!
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              I'm preparing helpful articles about AI tools, productivity strategies, 
              and actionable guides to help you work smarter with AI.
            </p>
            
            {/* Newsletter Signup */}
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Get Notified 🔔
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Be the first to read new articles about AI tools and strategies
                </p>
                <div className="flex gap-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button className="gradient-purple text-white px-6 py-2 rounded-xl font-medium hover:scale-105 transform transition-all duration-200">
                    Notify Me
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No results for current filter */
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No articles found
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
              Try adjusting your search terms or selecting a different category.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}
              className="gradient-purple text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transform transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* SEO Content Section */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                What to Expect 🎯
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Step-by-step AI implementation guides</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Real-world case studies and success stories</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Latest AI tools and platform reviews</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Productivity tips and workflow optimization</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Why Subscribe? ⚡
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>100% free access to all articles</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>No paywalls or premium content barriers</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Weekly insights delivered to your inbox</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Early access to new GPTs and playbooks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}