'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
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
  const [activeTab, setActiveTab] = useState<'content' | 'blog'>('content')
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

        // Load recent uploads and blog posts
        await loadRecentUploads()
        await loadBlogPosts()
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
      console.log('📡 Fetching content from admin API...')
      // Use admin API endpoint that bypasses RLS to ensure all content is visible
      const response = await fetch('/api/admin/content', {
        // Add cache busting to prevent stale data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }
      
      const result = await response.json()
      if (result.success) {
        // Show ALL content in admin panel, not just last 10
        setRecentUploads(result.content)
        console.log(`✅ Loaded ${result.content.length} items for admin panel`)
        console.log('📋 Content featured status:', result.content.map((item: any) => `${item.title}: ${item.is_featured}`))
      } else {
        throw new Error(result.error || 'Failed to load content')
      }
    } catch (err) {
      console.error('Error loading recent uploads:', err)
      showNotification('Load Failed', 'Unable to load content. Please refresh the page.', 'error')
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
      showNotification('Analysis Failed', 'Unable to analyze the content. Please check the URL or file and try again.', 'error')
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
      
      showNotification('Upload Successful', 'Content has been uploaded and analyzed successfully!', 'success')
    } catch (err) {
      console.error('Upload failed:', err)
      showNotification('Upload Failed', 'Unable to upload the content. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleFeature = async (item: any) => {
    try {
      const newFeaturedStatus = !item.is_featured
      console.log(`🔄 Toggling ${item.type} "${item.title}" from ${item.is_featured} to ${newFeaturedStatus}`)
      
      let toggleResult
      if (item.type === 'gpt') {
        toggleResult = await gptsService.toggleFeature(item.id, newFeaturedStatus)
      } else if (item.type === 'document') {
        toggleResult = await documentsService.toggleFeature(item.id, newFeaturedStatus)
      }
      
      console.log('🔄 Toggle API result:', toggleResult)

      // If the API call was successful, immediately update local state with the confirmed result
      if (toggleResult && toggleResult.success && toggleResult.updated) {
        const updated = toggleResult.updated
        console.log(`✅ Confirmed toggle: ${updated.title} is_featured = ${updated.is_featured}`)
        
        // Update local state with the confirmed database value
        setRecentUploads(prev => prev.map(upload => 
          upload.id === item.id 
            ? { ...upload, is_featured: updated.is_featured }
            : upload
        ))

        // Show success message
        const action = updated.is_featured ? 'featured' : 'unfeatured'
        showNotification(
          `${action.charAt(0).toUpperCase() + action.slice(1)} Successfully`,
          `"${item.title}" has been ${action} successfully!`,
          'success'
        )
      } else {
        throw new Error('Toggle API did not return success confirmation')
      }
      
    } catch (err) {
      console.error('Toggle feature failed:', err)
      showNotification('Update Failed', 'Failed to update feature status. Please try again.', 'error')
      
      // On error, reload data to ensure we show the correct state
      await loadRecentUploads()
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

      // Show success message
      showNotification(
        'Content Deleted',
        `"${item.title}" deleted successfully!`,
        'success'
      )
      
      // Small delay to ensure database delete completes, then reload content
      setTimeout(async () => {
        await loadRecentUploads()
      }, 500)
      
    } catch (err) {
      console.error('Delete failed:', err)
      showNotification('Delete Failed', 'Unable to delete the content. Please try again.', 'error')
    }
  }

  const handleGenerateBlog = async () => {
    if (!blogPrompt.trim()) return
    setShowProgress(true)
    setGeneratingBlog(true)
  }

  const handleBlogGenerationComplete = (blogPost: any) => {
    setGeneratedBlog(blogPost)
    setShowProgress(false)
    setGeneratingBlog(false)
    showNotification(
      'Blog Generated Successfully',
      `"${blogPost.title}" has been generated and is ready for review!`,
      'success'
    )
  }

  const handleBlogGenerationError = (error: string) => {
    setShowProgress(false)
    setGeneratingBlog(false)
    showNotification(
      'Blog Generation Failed',
      `${error}. Please check your API configuration and try again.`,
      'error'
    )
  }

  const handleBlogGenerationCancel = () => {
    setShowProgress(false)
    setGeneratingBlog(false)
    showNotification(
      'Generation Cancelled',
      'Blog generation has been cancelled.',
      'info'
    )
  }

  const handlePublishBlog = async () => {
    if (!generatedBlog) return

    setPublishingBlog(true)
    try {
      // Generate slug from title
      const slug = generatedBlog.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      const response = await blogService.createPost({
        title: generatedBlog.title,
        content: generatedBlog.content,
        slug: slug,
        published_at: new Date().toISOString(),
        meta_description: generatedBlog.meta_description,
        category: generatedBlog.category,
        read_time: generatedBlog.read_time
      })

      showNotification('Blog Published', 'Blog post published successfully!', 'success')
      setGeneratedBlog(null)
      setBlogPrompt('')
      setKnowledgeBase('')
      
      // Small delay to ensure database insert completes, then reload blog posts
      setTimeout(async () => {
        await loadBlogPosts()
      }, 500)
      
    } catch (err) {
      console.error('Blog publishing failed:', err)
      showNotification('Publish Failed', 'Failed to publish blog post. Please try again.', 'error')
    } finally {
      setPublishingBlog(false)
    }
  }

  const handleDeleteBlogPost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return
    }

    try {
      await blogService.deletePost(postId)
      showNotification('Blog Deleted', 'Blog post deleted successfully!', 'success')
      
      // Small delay to ensure database delete completes, then reload blog posts
      setTimeout(async () => {
        await loadBlogPosts()
      }, 500)
    } catch (err) {
      console.error('Blog deletion failed:', err)
      showNotification('Delete Failed', 'Failed to delete blog post. Please try again.', 'error')
    }
  }

  const handleUpdateBlogPost = async () => {
    if (!editingPost) return

    setPublishingBlog(true)
    try {
      // Generate new slug if title changed
      const slug = editingPost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      const updatedPost = await blogService.updatePost(editingPost.id, {
        title: editingPost.title,
        content: editingPost.content,
        slug: slug,
        meta_description: editingPost.meta_description,
        category: editingPost.category,
        read_time: Math.ceil(editingPost.content.split(' ').length / 200)
      })

      if (updatedPost) {
        showNotification('Blog Updated', 'Blog post updated successfully!', 'success')
        setEditingPost(null)
        
        // Small delay to ensure database update completes, then reload blog posts
        setTimeout(async () => {
          await loadBlogPosts()
        }, 500)
      } else {
        throw new Error('Failed to update blog post')
      }
    } catch (err) {
      console.error('Blog update failed:', err)
      showNotification('Update Failed', 'Failed to update blog post. Please try again.', 'error')
    } finally {
      setPublishingBlog(false)
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
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white overflow-x-hidden">
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
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Dashboard
              </Link>
              <Link href="/gpts" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                GPTs
              </Link>
              <Link href="/documents" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Playbooks
              </Link>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                🔧 Admin
              </div>
            </div>

            {/* Mobile Navigation */}
            <InternalMobileNavigation 
              userEmail={user.email}
              isPro={user.is_pro}
              showAdminLink={true}
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-hidden">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 gradient-purple rounded-2xl mb-6 shadow-2xl animate-float">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Content Management Studio
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
            Upload GPT links, PDF documents, and manage blog content with AI assistance!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex flex-col sm:flex-row bg-gray-100 rounded-xl p-1 w-full sm:w-auto max-w-sm mx-auto">
              <button
                onClick={() => setActiveTab('content')}
                className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === 'content'
                    ? 'gradient-purple text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                📤 Content Upload
              </button>
              <button
                onClick={() => setActiveTab('blog')}
                className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === 'blog'
                    ? 'gradient-purple text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                ✍️ Blog Management
              </button>
            </div>
          </div>
        </div>

        {/* Content Upload Tab */}
        {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-purple-100/50">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center flex-wrap">
              <span className="text-xl sm:text-2xl mr-2 sm:mr-3">📤</span>
              <span>Upload Content</span>
            </h2>

            {/* Upload Type Toggle */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row bg-gray-100 rounded-xl p-1 gap-1 sm:gap-0">
                <button
                  onClick={() => setUploadType('gpt')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    uploadType === 'gpt'
                      ? 'gradient-purple text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  🤖 GPT Link
                </button>
                <button
                  onClick={() => setUploadType('document')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    uploadType === 'document'
                      ? 'gradient-purple text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  📄 PDF Document
                </button>
              </div>
            </div>

            {/* Input Section */}
            {uploadType === 'gpt' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-sm text-gray-600">
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
              className="w-full gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="mt-6 p-6 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis Results</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={analyzedContent.title}
                      onChange={(e) => setAnalyzedContent({ ...analyzedContent, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={analyzedContent.description}
                      onChange={(e) => setAnalyzedContent({ ...analyzedContent, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
                  className="w-full mt-4 gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg disabled:opacity-50"
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-purple-100/50">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center flex-wrap">
              <span className="text-lg sm:text-xl lg:text-2xl mr-2 sm:mr-3">📊</span>
              <span>Content Management</span>
            </h2>

            {/* Filter Buttons */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row bg-gray-100 rounded-xl p-1 gap-1 sm:gap-0">
                <button
                  onClick={() => setContentFilter('gpt')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    contentFilter === 'gpt'
                      ? 'gradient-purple text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  🤖 GPTs
                </button>
                <button
                  onClick={() => setContentFilter('document')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    contentFilter === 'document'
                      ? 'gradient-purple text-white shadow-lg'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  📚 Playbooks
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
            {/* GPTs Section */}
            {contentFilter === 'gpt' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-lg mr-2">🤖</span>
                <span>GPTs Collection</span>
              </h3>

              {recentUploads.filter(item => item.type === 'gpt').length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {recentUploads.filter(item => item.type === 'gpt').map((item, index) => (
                    <div key={`gpt-${item.id}`} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg flex-shrink-0">🤖</span>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.title}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
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
                        <div className="ml-2 sm:ml-4 flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleToggleFeature(item)}
                            className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-feedback ${
                              item.is_featured
                                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-feedback"
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
                  <p className="text-gray-600">No GPTs uploaded yet. Start by analyzing your first GPT!</p>
                </div>
              )}
            </div>
            )}

            {/* Playbooks Section */}
            {contentFilter === 'document' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-lg mr-2">📚</span>
                <span>Playbooks Collection</span>
              </h3>

              {recentUploads.filter(item => item.type === 'document').length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {recentUploads.filter(item => item.type === 'document').map((item, index) => (
                    <div key={`doc-${item.id}`} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg flex-shrink-0">📄</span>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.title}</h3>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-2">{item.description}</p>
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
                        <div className="ml-2 sm:ml-4 flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleToggleFeature(item)}
                            className={`p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-feedback ${
                              item.is_featured
                                ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-feedback"
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
                  <p className="text-gray-600">No playbooks uploaded yet. Start by analyzing your first PDF!</p>
                </div>
              )}
            </div>
            )}
            </div>
          </div>
        </div>
        )}

        {/* Blog Management Tab */}
        {activeTab === 'blog' && (
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-purple-100/50">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center flex-wrap">
                <span className="text-xl sm:text-2xl mr-2 sm:mr-3">✍️</span>
                <span>AI Blog Writing Assistant</span>
              </h2>
              
              <div className="space-y-6">
                {/* Real-time Progress Section */}
                {showProgress && (
                  <BlogGenerationProgress
                    prompt={blogPrompt}
                    knowledgeBase={knowledgeBase}
                    includeWebSearch={includeWebSearch}
                    includeImages={includeImages}
                    onComplete={handleBlogGenerationComplete}
                    onError={handleBlogGenerationError}
                    onCancel={handleBlogGenerationCancel}
                  />
                )}

                {/* AI Blog Writing Section */}
                {!showProgress && (
                <div className="p-4 sm:p-6 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Write New Blog Post with AI</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blog Topic or Prompt
                      </label>
                      <textarea
                        value={blogPrompt}
                        onChange={(e) => setBlogPrompt(e.target.value)}
                        placeholder="e.g., 'Write a blog post about the best AI tools for content creators in 2025'"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Knowledge Base (Optional)
                      </label>
                      <textarea
                        value={knowledgeBase}
                        onChange={(e) => setKnowledgeBase(e.target.value)}
                        placeholder="Paste any additional context, research, or specific information you want the AI to use when writing the blog post..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Add SEO best practices, research data, or specific points you want covered
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="webSearch"
                          checked={includeWebSearch}
                          onChange={(e) => setIncludeWebSearch(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="webSearch" className="text-sm text-gray-700">
                          🌍 Include web search for latest info
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="includeImages"
                          checked={includeImages}
                          onChange={(e) => setIncludeImages(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="includeImages" className="text-sm text-gray-700">
                          🎨 Generate AI images (GPT-4o)
                        </label>
                      </div>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <span className="font-medium">💡 AI Workflow:</span> The AI will research the web for latest information, analyze your knowledge base, write the blog post, and generate relevant images.
                      <div className="mt-2 text-xs">
                        <strong>Process:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Search web for latest information (if enabled)</li>
                          <li>Analyze platform docs + writing instructions + SEO guide</li>
                          <li>Write comprehensive blog post with GPT-4o</li>
                          <li>Generate 2-3 relevant images with GPT-4o (if enabled)</li>
                          <li>Present for your review and editing</li>
                        </ol>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleGenerateBlog}
                      disabled={generatingBlog || !blogPrompt.trim()}
                      className="w-full gradient-purple text-white py-3 px-4 rounded-xl font-semibold button-hover shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingBlog ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          AI is writing your blog post...
                        </span>
                      ) : (
                        '🤖 Generate Blog Post with AI'
                      )}
                    </button>
                  </div>
                </div>
                )}

                {/* Generated Blog Preview */}
                {generatedBlog && (
                  <div className="p-4 sm:p-6 bg-green-50 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Generated Blog Post</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={generatedBlog.title}
                          onChange={(e) => setGeneratedBlog({ ...generatedBlog, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                        <input
                          type="text"
                          value={generatedBlog.meta_description}
                          onChange={(e) => setGeneratedBlog({ ...generatedBlog, meta_description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">{generatedBlog.meta_description.length}/160 characters</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={generatedBlog.category}
                          onChange={(e) => setGeneratedBlog({ ...generatedBlog, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="AI Tools">AI Tools</option>
                          <option value="Strategy">Strategy</option>
                          <option value="Business Planning">Business Planning</option>
                          <option value="Productivity">Productivity</option>
                          <option value="Communication">Communication</option>
                          <option value="Automation">Automation</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Design">Design</option>
                          <option value="Development">Development</option>
                        </select>
                      </div>
                      
                      {/* Generated Images */}
                      {generatedBlog.generated_images && generatedBlog.generated_images.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Generated Images</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {generatedBlog.generated_images.map((image: any, index: number) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-3">
                                <img 
                                  src={image.url} 
                                  alt={image.prompt} 
                                  className="w-full h-32 object-cover rounded-lg mb-2"
                                />
                                <p className="text-xs text-gray-600 mb-2">{image.prompt}</p>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`image-${index}`}
                                    defaultChecked={true}
                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                  />
                                  <label htmlFor={`image-${index}`} className="text-xs text-gray-700">
                                    Include in blog
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                          value={generatedBlog.content}
                          onChange={(e) => setGeneratedBlog({ ...generatedBlog, content: e.target.value })}
                          rows={15}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-sm text-gray-600">
                          📖 Estimated read time: {generatedBlog.read_time} minutes
                        </span>
                        
                        <div className="space-x-3">
                          <button
                            onClick={() => setGeneratedBlog(null)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handlePublishBlog}
                            disabled={publishingBlog}
                            className="px-4 py-2 gradient-purple text-white rounded-lg font-semibold button-hover shadow-lg disabled:opacity-50"
                          >
                            {publishingBlog ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Publishing...
                              </span>
                            ) : (
                              '🚀 Publish Blog Post'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blog Post Editor */}
                {editingPost && (
                  <div className="p-4 sm:p-6 bg-yellow-50 rounded-xl border border-yellow-200 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Blog Post</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={editingPost.title}
                          onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                        <input
                          type="text"
                          value={editingPost.meta_description}
                          onChange={(e) => setEditingPost({ ...editingPost, meta_description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          maxLength={160}
                        />
                        <p className="text-xs text-gray-500 mt-1">{editingPost.meta_description.length}/160 characters</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={editingPost.category}
                          onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <option value="AI Tools">AI Tools</option>
                          <option value="Strategy">Strategy</option>
                          <option value="Business Planning">Business Planning</option>
                          <option value="Productivity">Productivity</option>
                          <option value="Communication">Communication</option>
                          <option value="Automation">Automation</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Design">Design</option>
                          <option value="Development">Development</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                          value={editingPost.content}
                          onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                          rows={15}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-4">
                        <span className="text-sm text-gray-600">
                          📖 Estimated read time: {Math.ceil(editingPost.content.split(' ').length / 200)} minutes
                        </span>
                        
                        <div className="space-x-3">
                          <button
                            onClick={() => setEditingPost(null)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateBlogPost}
                            disabled={publishingBlog}
                            className="px-4 py-2 gradient-purple text-white rounded-lg font-semibold button-hover shadow-lg disabled:opacity-50"
                          >
                            {publishingBlog ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Updating...
                              </span>
                            ) : (
                              '💾 Update Blog Post'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Blog Posts Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Existing Posts</h3>
                  
                  {blogPosts.length > 0 ? (
                    <div className="space-y-4">
                      {blogPosts.map((post) => (
                        <div key={post.id} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg flex-shrink-0">📝</span>
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">{post.title}</h4>
                              </div>
                              <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                                {post.meta_description || post.content.slice(0, 100) + '...'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full whitespace-nowrap">
                                  {post.category}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                                  {post.read_time} min read
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(post.published_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2 sm:ml-4 flex items-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() => setEditingPost(post)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-feedback"
                                title="Edit this post"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteBlogPost(post.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center touch-feedback"
                                title="Delete this post"
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
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-4xl mb-2">📝</div>
                      <p>No blog posts yet. Create your first one using the AI assistant above!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
