'use client'

// Force dynamic rendering to avoid build-time database calls
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import { userService, type UserProfile, type UserTier, TIER_FEATURES } from '@/lib/user'
import InternalMobileNavigation from '@/components/InternalMobileNavigation'
import NotificationModal from '@/components/NotificationModal'
import BlogGenerationProgress from '@/components/BlogGenerationProgress'
import { gptsService } from '@/lib/gpts'
import { documentsService } from '@/lib/documents'
import { blogService, type BlogPost } from '@/lib/blog'
import { aiService } from '@/lib/ai'

interface AnalyzedContent {
  title: string
  description: string
  category: string
}

export default function AdminPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'blog' | 'tier'>('content')
  const [contentFilter, setContentFilter] = useState<'gpt' | 'document'>('gpt')
  const [uploadType, setUploadType] = useState<'gpt' | 'document'>('gpt')
  const [gptUrl, setGptUrl] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null)
  const [uploading, setUploading] = useState(false)
  const [recentUploads, setRecentUploads] = useState<any[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [blogPrompt, setBlogPrompt] = useState('')
  const [generatingBlog, setGeneratingBlog] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState('')
  const [generatedBlog, setGeneratedBlog] = useState<any>(null)
  const [publishingBlog, setPublishingBlog] = useState(false)
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [includeImages, setIncludeImages] = useState(true)
  const [searchProvider] = useState<'perplexity'>('perplexity')
  const [searchContextSize] = useState<'medium'>('medium')
  const [showProgress, setShowProgress] = useState(false)
  const [notification, setNotification] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  
  // Tier switching state
  const [switchingTier, setSwitchingTier] = useState(false)
  const [confirmTierChange, setConfirmTierChange] = useState<{
    isOpen: boolean
    targetTier: UserTier | null
  }>({
    isOpen: false,
    targetTier: null
  })
  const [tierTestData, setTierTestData] = useState<{
    gpts: any[]
    documents: any[]
  }>({
    gpts: [],
    documents: []
  })
  
  const router = useRouter()

  // Helper function to show notifications
  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({
      isOpen: true,
      title,
      message,
      type
    })
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  // Tier switching functions
  const loadTierTestData = async () => {
    try {
      const [gpts, documents] = await Promise.all([
        gptsService.getAllGPTs(),
        documentsService.getAllDocuments()
      ])
      
      setTierTestData({ gpts, documents })
    } catch (error) {
      console.error('Error loading tier test data:', error)
    }
  }

  const handleTierChange = async (targetTier: UserTier) => {
    if (!user) return
    
    setSwitchingTier(true)
    try {
      // Direct database update for admin user only
      const success = await userService.updateTier(user.id, targetTier)
      
      if (success) {
        // Update local user state
        setUser(prev => prev ? { ...prev, user_tier: targetTier, is_pro: targetTier === 'pro' || targetTier === 'ultra' } : null)
        
        showNotification(
          'Tier Changed Successfully',
          `Admin tier switched to ${TIER_FEATURES[targetTier].name} (${targetTier.toUpperCase()})`,
          'success'
        )
        
        // Refresh tier test data
        await loadTierTestData()
      } else {
        showNotification('Error', 'Failed to change tier', 'error')
      }
    } catch (error) {
      console.error('Error changing tier:', error)
      showNotification('Error', 'Failed to change tier', 'error')
    } finally {
      setSwitchingTier(false)
      setConfirmTierChange({ isOpen: false, targetTier: null })
    }
  }

  const getTierAccessSummary = (tier: UserTier) => {
    const tierInfo = TIER_FEATURES[tier]
    const accessibleGpts = tierTestData.gpts.filter(gpt => 
      userService.hasAccessToTier(tier, gpt.required_tier || 'free')
    )
    const accessibleDocs = tierTestData.documents.filter(doc => 
      userService.hasAccessToTier(tier, doc.required_tier || 'free')
    )
    
    return {
      ...tierInfo,
      accessibleGpts: accessibleGpts.length,
      accessibleDocs: accessibleDocs.length,
      totalGpts: tierTestData.gpts.length,
      totalDocs: tierTestData.documents.length
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const { user: authUser, error } = await auth.getUser()
        
        if (error || !authUser) {
          router.push('/login')
          return
        }

        // Get user profile
        const userProfile = await userService.getProfile(authUser.id)
        if (userProfile) {
          setUser(userProfile)
          
          // Check if user is admin (you can modify this check)
          if (userProfile.email !== 'samcarr1232@gmail.com') {
            router.push('/dashboard')
            return
          }
        }

        // Load recent uploads, blog posts, and tier test data
        await Promise.all([loadRecentUploads(), loadBlogPosts(), loadTierTestData()])
      } catch (err) {
        console.error('Error loading data:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadRecentUploads = async () => {
    try {
      const [gpts, documents] = await Promise.all([
        gptsService.getAllGPTs(),
        documentsService.getAllDocuments()
      ])
      
      // Combine and sort by date
      const allUploads = [
        ...gpts.map(gpt => ({ ...gpt, type: 'gpt' })),
        ...documents.map(doc => ({ ...doc, type: 'document' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setRecentUploads(allUploads.slice(0, 10)) // Show last 10
    } catch (err) {
      console.error('Error loading recent uploads:', err)
    }
  }

  const loadBlogPosts = async () => {
    try {
      const posts = await blogService.getAllPosts()
      setBlogPosts(posts)
    } catch (err) {
      console.error('Error loading blog posts:', err)
    }
  }

  const createSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const handleCreateBlogPost = async (postData: {
    title: string
    content: string
    meta_description: string
    category: string
  }) => {
    try {
      const slug = createSlug(postData.title)
      const read_time = calculateReadTime(postData.content)
      
      const newPost = await blogService.createPost({
        title: postData.title,
        content: postData.content,
        slug,
        published_at: new Date().toISOString(),
        meta_description: postData.meta_description,
        category: postData.category,
        read_time
      })

      if (newPost) {
        setBlogPosts(prev => [newPost, ...prev])
        setIsCreatingPost(false)
        showNotification('Success', 'Blog post created successfully!', 'success')
      }
    } catch (err) {
      console.error('Error creating blog post:', err)
      showNotification('Error', 'Failed to create blog post. Please try again.', 'error')
    }
  }

  const handleUpdateBlogPost = async (postId: string, updates: Partial<BlogPost>) => {
    try {
      const updatedPost = await blogService.updatePost(postId, updates)
      if (updatedPost) {
        setBlogPosts(prev => prev.map(post => post.id === postId ? updatedPost : post))
        setEditingPost(null)
        alert('Blog post updated successfully!')
      }
    } catch (err) {
      console.error('Error updating blog post:', err)
      alert('Failed to update blog post. Please try again.')
    }
  }

  const handleDeleteBlogPost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const success = await blogService.deletePost(postId)
      if (success) {
        setBlogPosts(prev => prev.filter(post => post.id !== postId))
        alert('Blog post deleted successfully!')
      }
    } catch (err) {
      console.error('Error deleting blog post:', err)
      alert('Failed to delete blog post. Please try again.')
    }
  }

  const handleAnalyze = async () => {
    if (!gptUrl && !documentFile) return

    setAnalyzing(true)
    try {
      let analyzed: AnalyzedContent | null = null

      if (uploadType === 'gpt' && gptUrl) {
        analyzed = await aiService.analyzeGPT(gptUrl)
      } else if (uploadType === 'document' && documentFile) {
        analyzed = await aiService.analyzeDocument(documentFile)
      }

      setAnalyzedContent(analyzed)
    } catch (err) {
      console.error('Analysis failed:', err)
      alert('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUpload = async () => {
    if (!analyzedContent) return

    setUploading(true)
    try {
      if (uploadType === 'gpt' && gptUrl) {
        await gptsService.createGPT({
          title: analyzedContent.title,
          description: analyzedContent.description,
          chatgpt_url: gptUrl,
          category: analyzedContent.category,
        })
      } else if (uploadType === 'document' && documentFile) {
        await documentsService.createDocument({
          title: analyzedContent.title,
          description: analyzedContent.description,
          file: documentFile,
          category: analyzedContent.category,
        })
      }

      // Reset form
      setGptUrl('')
      setDocumentFile(null)
      setAnalyzedContent(null)
      
      // Reload recent uploads
      await loadRecentUploads()
      
      alert('Content uploaded successfully!')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleFeature = async (item: any) => {
    try {
      const newFeaturedStatus = !item.is_featured
      
      if (item.type === 'gpt') {
        await gptsService.toggleFeature(item.id, newFeaturedStatus)
      } else if (item.type === 'document') {
        await documentsService.toggleFeature(item.id, newFeaturedStatus)
      }

      // Update local state immediately
      setRecentUploads(prev => prev.map(upload => 
        upload.id === item.id 
          ? { ...upload, is_featured: newFeaturedStatus }
          : upload
      ))
      
      // Show success message and reload data to reflect changes
      const action = newFeaturedStatus ? 'featured' : 'unfeatured'
      alert(`"${item.title}" has been ${action} successfully! Refreshing content to show changes.`)
      
      // Reload recent uploads to show updated status
      await loadRecentUploads()
      
    } catch (err) {
      console.error('Toggle feature failed:', err)
      alert('Failed to update feature status. Please try again.')
    }
  }

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      if (item.type === 'gpt') {
        await gptsService.deleteGPT(item.id)
      } else if (item.type === 'document') {
        await documentsService.deleteDocument(item.id)
      }

      // Remove from local state immediately for instant feedback
      setRecentUploads(prev => prev.filter(upload => upload.id !== item.id))
      
      // Show success message
      alert(`"${item.title}" deleted successfully! The content has been removed from all pages.`)
      
      // Small delay then reload the page to ensure all content lists are updated
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Delete failed. Please try again.')
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
      {/* Header */}
      <header className="glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🤖</span>
              </div>
              <span className="text-xl font-semibold text-gradient">thehackai</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm text-gray-100 hover:text-purple-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/gpts" className="text-sm text-gray-100 hover:text-purple-600 transition-colors">
                GPTs
              </Link>
              <Link href="/documents" className="text-sm text-gray-100 hover:text-purple-600 transition-colors">
                Playbooks
              </Link>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                🔧 Admin
              </div>
            </div>

            {/* Mobile Navigation */}
            <InternalMobileNavigation 
              userEmail={user.email}
              userTier={user.user_tier || 'free'}
              showAdminLink={true}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-6 shadow-2xl animate-float">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Content Management Studio
          </h1>
          <p className="text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed">
            Manage your GPTs, playbooks, and blog posts all in one place with AI-powered analysis!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-purple-100/50 max-w-2xl mx-auto">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'content'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-100 hover:text-purple-600'
                }`}
              >
                📚 Content Manager
              </button>
              <button
                onClick={() => setActiveTab('blog')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'blog'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-100 hover:text-purple-600'
                }`}
              >
                ✍️ Blog Manager
              </button>
              <button
                onClick={() => setActiveTab('tier')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm ${
                  activeTab === 'tier'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-100 hover:text-purple-600'
                }`}
              >
                🎯 Tier Testing
              </button>
            </div>
          </div>
        </div>

        {/* Content Management Tab */}
        {activeTab === 'content' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">📤</span>
              Upload Content
            </h2>

            {/* Upload Type Toggle */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row bg-gray-800 rounded-xl p-1 gap-1 sm:gap-0">
                <button
                  onClick={() => setUploadType('gpt')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    uploadType === 'gpt'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-100 hover:text-purple-600'
                  }`}
                >
                  🤖 GPT Link
                </button>
                <button
                  onClick={() => setUploadType('document')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    uploadType === 'document'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-100 hover:text-purple-600'
                  }`}
                >
                  📄 PDF Document
                </button>
              </div>
            </div>

            {/* Input Section */}
            {uploadType === 'gpt' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  ChatGPT URL
                </label>
                <input
                  type="url"
                  value={gptUrl}
                  onChange={(e) => setGptUrl(e.target.value)}
                  placeholder="https://chatgpt.com/g/g-..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-100 mb-2">
                  PDF Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📄</div>
                    <p className="text-sm text-gray-100">
                      {documentFile ? documentFile.name : 'Click to upload PDF or drag and drop'}
                    </p>
                  </label>
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing || (!gptUrl && !documentFile)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Analyzing with AI...
                </span>
              ) : (
                '🔍 Analyze with AI'
              )}
            </button>

            {/* Analysis Results */}
            {analyzedContent && (
              <div className="mt-6 p-6 bg-purple-900/20 rounded-xl border border-purple-500/30">
                <h3 className="text-lg font-semibold text-white mb-4">AI Analysis Results</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-1">Title</label>
                    <input
                      type="text"
                      value={analyzedContent.title}
                      onChange={(e) => setAnalyzedContent({ ...analyzedContent, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-1">Description</label>
                    <textarea
                      value={analyzedContent.description}
                      onChange={(e) => setAnalyzedContent({ ...analyzedContent, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-1">Category</label>
                    <select
                      value={analyzedContent.category}
                      onChange={(e) => setAnalyzedContent({ ...analyzedContent, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Business Planning">Business Planning</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Communication">Communication</option>
                      <option value="Automation">Automation</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Design">Design</option>
                      <option value="Development">Development</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    '🚀 Upload to Collection'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Content Management */}
          <div className="space-y-6">
            {/* GPTs Section */}
            <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <span className="text-2xl mr-3">🤖</span>
                GPTs Collection
              </h2>

              {recentUploads.filter(item => item.type === 'gpt').length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {recentUploads.filter(item => item.type === 'gpt').map((item, index) => (
                    <div key={`gpt-${item.id}`} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg flex-shrink-0">🤖</span>
                            <h3 className="font-semibold text-white text-sm leading-tight truncate">{item.title}</h3>
                          </div>
                          <p className="text-xs text-gray-100 mb-2 leading-relaxed">{item.description.slice(0, 80)}...</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                              {item.category}
                            </span>
                            {item.is_featured && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleFeature(item)}
                            className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                              item.is_featured
                                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                : 'text-gray-200 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete this GPT"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-gray-100">No GPTs uploaded yet. Start by analyzing your first GPT!</p>
                </div>
              )}
            </div>

            {/* Playbooks Section */}
            <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <span className="text-2xl mr-3">📚</span>
                Playbooks Collection
              </h2>

              {recentUploads.filter(item => item.type === 'document').length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {recentUploads.filter(item => item.type === 'document').map((item, index) => (
                    <div key={`doc-${item.id}`} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg flex-shrink-0">📄</span>
                            <h3 className="font-semibold text-white text-sm leading-tight truncate">{item.title}</h3>
                          </div>
                          <p className="text-xs text-gray-100 mb-2 leading-relaxed">{item.description.slice(0, 80)}...</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                              {item.category}
                            </span>
                            {item.is_featured && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full whitespace-nowrap">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleFeature(item)}
                            className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
                              item.is_featured
                                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                : 'text-gray-200 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                            title="Delete this playbook"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-gray-100">No playbooks uploaded yet. Start by analyzing your first PDF!</p>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Blog Management Tab */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            {/* Blog Actions Header */}
            <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center">
                  <span className="text-2xl mr-3">✍️</span>
                  Blog Posts Management
                </h2>
                <button
                  onClick={() => setIsCreatingPost(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold button-hover shadow-lg"
                >
                  ➕ Create New Post
                </button>
              </div>

              {/* Blog Posts List */}
              {blogPosts.length > 0 ? (
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="p-6 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {post.category}
                            </span>
                            <span className="text-xs bg-gray-700 text-gray-100 px-2 py-1 rounded-full">
                              {post.read_time} min read
                            </span>
                          </div>
                          <p className="text-sm text-gray-100 mb-3">{post.meta_description}</p>
                          <div className="text-xs text-gray-100">
                            Published: {new Date(post.published_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <button
                            onClick={() => setEditingPost(post)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Edit post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteBlogPost(post.id, post.title)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete post"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✍️</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No blog posts yet
                  </h3>
                  <p className="text-gray-100 mb-6">
                    Create your first blog post to start sharing AI insights and tutorials!
                  </p>
                  <button
                    onClick={() => setIsCreatingPost(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold button-hover shadow-lg"
                  >
                    Create Your First Post ✨
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blog Post Creation/Edit Modal */}
        {(isCreatingPost || editingPost) && (
          <BlogPostModal
            isOpen={isCreatingPost || editingPost !== null}
            onClose={() => {
              setIsCreatingPost(false)
              setEditingPost(null)
            }}
            onSave={editingPost ? 
              (data) => handleUpdateBlogPost(editingPost.id, data) : 
              handleCreateBlogPost
            }
            initialData={editingPost}
            title={editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}
          />
        )}
      </div>

      {/* Tier Testing Tab */}
      {activeTab === 'tier' && (
        <div className="space-y-6">
          {/* Current Tier Status */}
          <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              Admin Tier Management
            </h2>
            
            {/* Current Status */}
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Current Admin Tier</h3>
                  <p className="text-gray-100">Testing subscription access as: {user?.email}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                  user?.user_tier === 'ultra' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : user?.user_tier === 'pro'
                      ? 'bg-purple-900/30 text-purple-200'
                      : 'bg-gray-800 text-gray-100'
                }`}>
                  {user?.user_tier?.toUpperCase() || 'FREE'} TIER
                </div>
              </div>
            </div>

            {/* Tier Switch Buttons */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Tier Switch</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['free', 'pro', 'ultra'] as UserTier[]).map((tier) => {
                  const isCurrentTier = user?.user_tier === tier
                  const tierInfo = TIER_FEATURES[tier]
                  const accessSummary = getTierAccessSummary(tier)
                  
                  return (
                    <button
                      key={tier}
                      onClick={() => setConfirmTierChange({ isOpen: true, targetTier: tier })}
                      disabled={isCurrentTier || switchingTier}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        isCurrentTier
                          ? 'bg-green-900/20 border-green-500/30 text-green-300 cursor-not-allowed'
                          : 'bg-slate-800/80 border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">{tierInfo.name}</h4>
                          <span className="text-sm text-gray-100">£{tierInfo.price}/mo</span>
                        </div>
                        <p className="text-sm text-gray-100 mb-3">{tierInfo.description}</p>
                        <div className="text-xs text-gray-300">
                          <div>📱 {accessSummary.accessibleGpts}/{accessSummary.totalGpts} GPTs</div>
                          <div>📚 {accessSummary.accessibleDocs}/{accessSummary.totalDocs} Playbooks</div>
                        </div>
                        {isCurrentTier && (
                          <div className="mt-2 text-xs font-medium text-green-600">
                            ✅ Current Tier
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Testing Information */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
              <h4 className="font-semibold text-yellow-200 mb-2">⚠️ Admin Testing Mode</h4>
              <ul className="text-sm text-yellow-100 space-y-1">
                <li>• This bypasses Stripe and changes your tier instantly</li>
                <li>• Only works for admin email: samcarr1232@gmail.com</li>
                <li>• Use this to test content access and upgrade flows</li>
                <li>• Regular users will use normal Stripe payment flow</li>
              </ul>
            </div>
          </div>

          {/* Tier Access Summary */}
          <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">📊</span>
              Content Access Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['free', 'pro', 'ultra'] as UserTier[]).map((tier) => {
                const accessSummary = getTierAccessSummary(tier)
                const isCurrentTier = user?.user_tier === tier
                
                return (
                  <div key={tier} className={`p-6 rounded-xl border-2 ${
                    isCurrentTier 
                      ? 'bg-purple-900/20 border-purple-500/30' 
                      : 'bg-gray-800 border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{accessSummary.name}</h3>
                      {isCurrentTier && (
                        <span className="text-sm bg-purple-900/30 text-purple-200 px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-100">GPTs Access</span>
                        <span className="text-sm font-medium">
                          {accessSummary.accessibleGpts}/{accessSummary.totalGpts}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-100">Playbooks Access</span>
                        <span className="text-sm font-medium">
                          {accessSummary.accessibleDocs}/{accessSummary.totalDocs}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-100">{accessSummary.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Test Links */}
          <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <span className="text-2xl mr-3">🧪</span>
              Quick Testing Links
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/gpts"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl hover:bg-purple-900/30 transition-colors"
              >
                <h3 className="font-semibold text-purple-200">🤖 Test GPTs Page</h3>
                <p className="text-sm text-purple-100">Test tier-based GPT access and upgrade prompts</p>
              </a>
              
              <a
                href="/documents"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl hover:bg-blue-900/30 transition-colors"
              >
                <h3 className="font-semibold text-blue-200">📚 Test Playbooks Page</h3>
                <p className="text-sm text-blue-100">Test tier-based document access and downloads</p>
              </a>
              
              <a
                href="/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl hover:bg-green-900/30 transition-colors"
              >
                <h3 className="font-semibold text-green-200">📊 Test Dashboard</h3>
                <p className="text-sm text-green-100">Test tier-specific dashboard content</p>
              </a>
              
              <a
                href="/upgrade"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl hover:bg-orange-900/30 transition-colors"
              >
                <h3 className="font-semibold text-orange-200">💳 Test Upgrade Page</h3>
                <p className="text-sm text-orange-100">Test tier-based upgrade flows and pricing</p>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tier Change Confirmation Modal */}
      {confirmTierChange.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800/80 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Tier Change</h3>
            <p className="text-gray-100 mb-6">
              Are you sure you want to switch to <strong>{TIER_FEATURES[confirmTierChange.targetTier!]?.name}</strong> tier?
              This will immediately change your access level for testing purposes.
            </p>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setConfirmTierChange({ isOpen: false, targetTier: null })}
                className="px-4 py-2 text-gray-100 border border-gray-600 rounded-lg hover:bg-gray-700"
                disabled={switchingTier}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTierChange(confirmTierChange.targetTier!)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                disabled={switchingTier}
              >
                {switchingTier ? 'Switching...' : 'Switch Tier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </DarkThemeBackground>
  )
}

// Blog Post Modal Component
interface BlogPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: BlogPost | null
  title: string
}

function BlogPostModal({ isOpen, onClose, onSave, initialData, title }: BlogPostModalProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    meta_description: initialData?.meta_description || '',
    category: initialData?.category || 'AI Strategy'
  })

  const categories = [
    'AI Strategy',
    'Tutorials', 
    'Productivity',
    'Tools',
    'Development',
    'Business'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim() || !formData.meta_description.trim()) {
      alert('Please fill in all required fields')
      return
    }
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/80 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-100 hover:text-gray-200 p-2 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter blog post title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description *
            </label>
            <textarea
              value={formData.meta_description}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief description for SEO and social sharing..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content * (Markdown supported)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="Write your blog post content here... You can use Markdown formatting."
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-100 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold button-hover shadow-lg"
            >
              {initialData ? 'Update Post' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}