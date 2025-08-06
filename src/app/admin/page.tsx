'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { userService, type UserProfile, type UserTier, TIER_FEATURES } from '@/lib/user'
import { gptsService } from '@/lib/gpts'
import { documentsService } from '@/lib/documents'
import { blogService, type BlogPost } from '@/lib/blog'
import { aiService } from '@/lib/ai'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import SmartNavigation from '@/components/SmartNavigation'
import NotificationModal from '@/components/NotificationModal'
import BlogGenerationProgress from '@/components/BlogGenerationProgress'
import ReactMarkdown from 'react-markdown'

interface AnalyzedContent {
  title: string
  description: string
  category: string
}

export default function AdminPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'content' | 'blog' | 'tier'>('content')
  const [gpts, setGpts] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [uploadType, setUploadType] = useState<'gpt' | 'document'>('gpt')
  const [gptUrl, setGptUrl] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzedContent, setAnalyzedContent] = useState<AnalyzedContent | null>(null)
  const [uploading, setUploading] = useState(false)
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

  // Blog generation state
  const [showBlogModal, setShowBlogModal] = useState(false)
  const [blogPrompt, setBlogPrompt] = useState('')
  const [blogKnowledge, setBlogKnowledge] = useState('')
  const [includeWebSearch, setIncludeWebSearch] = useState(true)
  const [includeImages, setIncludeImages] = useState(true)
  const [imageCount, setImageCount] = useState(2) // Default to 2 images
  const [generatingBlog, setGeneratingBlog] = useState(false)
  
  // Blog preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewBlog, setPreviewBlog] = useState<any>(null)

  // Tier testing state
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

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ isOpen: true, title, message, type })
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  // Tier testing functions
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
        const { user: authUser, error } = await auth.getUser()
        
        if (error || !authUser) {
          router.push('/login')
          return
        }

        const userProfile = await userService.getProfile(authUser.id)
        if (userProfile) {
          setUser(userProfile)
          
          if (userProfile.email !== 'samcarr1232@gmail.com') {
            router.push('/dashboard')
            return
          }
        }

        await Promise.all([loadContent(), loadTierTestData()])
      } catch (err) {
        console.error('Error loading data:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const loadContent = async () => {
    try {
      const [gptsData, documentsData, blogData] = await Promise.all([
        gptsService.getAllGPTs(),
        documentsService.getAllDocuments(),
        blogService.getAllPosts(true) // Include drafts in admin panel
      ])
      
      setGpts(gptsData)
      setDocuments(documentsData)
      setBlogPosts(blogData)
    } catch (err) {
      console.error('Error loading content:', err)
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
      showNotification('Error', 'Analysis failed. Please try again.', 'error')
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
          required_tier: 'ultra', // 🔒 CRITICAL FIX: New GPTs go to Ultra tier (Ultra gets everything)
        })
      } else if (uploadType === 'document' && documentFile) {
        await documentsService.createDocument({
          title: analyzedContent.title,
          description: analyzedContent.description,
          file: documentFile,
          category: analyzedContent.category,
          required_tier: 'ultra', // 🔒 CRITICAL FIX: New Documents go to Ultra tier (Ultra gets everything)
        })
      }

      setGptUrl('')
      setDocumentFile(null)
      setAnalyzedContent(null)
      
      await loadContent()
      showNotification('Success', 'Content uploaded successfully!', 'success')
    } catch (err) {
      console.error('Upload failed:', err)
      showNotification('Error', 'Upload failed. Please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleToggleFeature = async (item: any, type: 'gpt' | 'document') => {
    try {
      const newFeaturedStatus = !item.is_featured
      
      if (type === 'gpt') {
        await gptsService.toggleFeature(item.id, newFeaturedStatus)
      } else {
        await documentsService.toggleFeature(item.id, newFeaturedStatus)
      }

      await loadContent()
      const action = newFeaturedStatus ? 'featured' : 'unfeatured'
      showNotification('Success', `"${item.title}" has been ${action}!`, 'success')
    } catch (err) {
      console.error('Toggle feature failed:', err)
      showNotification('Error', 'Failed to update feature status.', 'error')
    }
  }

  const handleDelete = async (item: any, type: 'gpt' | 'document') => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return
    }

    try {
      if (type === 'gpt') {
        await gptsService.deleteGPT(item.id)
      } else {
        await documentsService.deleteDocument(item.id)
      }

      await loadContent()
      showNotification('Success', `"${item.title}" deleted successfully!`, 'success')
    } catch (err) {
      console.error('Delete failed:', err)
      showNotification('Error', 'Delete failed. Please try again.', 'error')
    }
  }

  if (loading) {
    return (
      <DarkThemeBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DarkThemeBackground>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} />
      <div className="min-h-screen">
        {/* Header */}
        <div className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl">⚙️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                  <p className="text-gray-400">Content Management System</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                🔧 Admin Access
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-white/10 bg-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 overflow-x-auto py-4">
              {[
                { id: 'content', label: 'Content Management', icon: '📚' },
                { id: 'blog', label: 'Blog Posts', icon: '✍️' },
                { id: 'tier', label: 'Tier Testing', icon: '🎯' }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    activeSection === section.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span className="hidden sm:inline">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeSection === 'content' && (
            <div className="space-y-8">
              {/* Upload Section */}
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">📤</span>
                  Upload New Content
                </h2>

                {/* Upload Type Toggle */}
                <div className="flex bg-slate-700 rounded-lg p-1 mb-6 max-w-sm">
                  <button
                    onClick={() => setUploadType('gpt')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      uploadType === 'gpt'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🤖 GPT
                  </button>
                  <button
                    onClick={() => setUploadType('document')}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      uploadType === 'document'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    📄 Document
                  </button>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  {uploadType === 'gpt' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        ChatGPT URL
                      </label>
                      <input
                        type="url"
                        value={gptUrl}
                        onChange={(e) => setGptUrl(e.target.value)}
                        placeholder="https://chatgpt.com/g/g-..."
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        PDF Document
                      </label>
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                          className="hidden"
                          id="pdf-upload"
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          <div className="text-4xl mb-2">📄</div>
                          <p className="text-sm text-gray-300">
                            {documentFile ? documentFile.name : 'Click to upload PDF'}
                          </p>
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || (!gptUrl && !documentFile)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzing ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </span>
                    ) : (
                      '🔍 Analyze with AI'
                    )}
                  </button>
                </div>

                {/* Analysis Results */}
                {analyzedContent && (
                  <div className="mt-6 p-6 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Analysis Results</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input
                          type="text"
                          value={analyzedContent.title}
                          onChange={(e) => setAnalyzedContent({ ...analyzedContent, title: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                          value={analyzedContent.description}
                          onChange={(e) => setAnalyzedContent({ ...analyzedContent, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <select
                          value={analyzedContent.category}
                          onChange={(e) => setAnalyzedContent({ ...analyzedContent, category: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50"
                    >
                      {uploading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </span>
                      ) : (
                        '🚀 Upload Content'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Content Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* GPTs */}
                <ContentList
                  title="GPTs Collection"
                  icon="🤖"
                  items={gpts}
                  onToggleFeature={(item) => handleToggleFeature(item, 'gpt')}
                  onDelete={(item) => handleDelete(item, 'gpt')}
                />

                {/* Documents */}
                <ContentList
                  title="Playbooks Collection"
                  icon="📚"
                  items={documents}
                  onToggleFeature={(item) => handleToggleFeature(item, 'document')}
                  onDelete={(item) => handleDelete(item, 'document')}
                />
              </div>
            </div>
          )}

          {activeSection === 'blog' && (
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <span className="mr-3">✍️</span>
                  Blog Posts
                </h2>
                <button 
                  onClick={() => setShowBlogModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-shadow">
                  ➕ New Post
                </button>
              </div>

              {blogPosts.length > 0 ? (
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <div key={post.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{post.title}</h3>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✅ Published
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{post.meta_description}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-400">
                            <span>{post.category}</span>
                            <span>•</span>
                            <span>{post.read_time} min read</span>
                            <span>•</span>
                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {/* Preview Button */}
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Preview"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          
                          {/* Publish/Unpublish Button - Hidden until status column added */}
                          {/* {post.status === 'draft' ? (
                            <button className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-slate-600 transition-colors" title="Publish">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </button>
                          ) : (
                            <button className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-slate-600 transition-colors" title="Unpublish">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                            </button>
                          )} */}
                          
                          {/* Delete Button */}
                          <button 
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this blog post?')) {
                                try {
                                  await blogService.deletePost(post.id)
                                  await loadContent()
                                  showNotification('Success', 'Blog post deleted!', 'success')
                                } catch (error) {
                                  showNotification('Error', 'Failed to delete post', 'error')
                                }
                              }
                            }}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-slate-600 transition-colors"
                            title="Delete"
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
                  <h3 className="text-xl font-semibold text-white mb-2">No blog posts yet</h3>
                  <p className="text-gray-400 mb-6">Create your first blog post to get started!</p>
                </div>
              )}
            </div>
          )}

          {activeSection === 'tier' && (
            <div className="space-y-8">
              {/* Current Tier Status */}
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">🎯</span>
                  Admin Tier Management
                </h2>
                
                {/* Current Status */}
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Current Admin Tier</h3>
                      <p className="text-gray-300">Testing subscription access as: {user?.email}</p>
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
                              : 'bg-slate-700/50 border-slate-600 hover:border-purple-300 hover:shadow-md text-white'
                          }`}
                        >
                          <div className="text-left">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{tierInfo.name}</h4>
                              <span className="text-sm text-gray-300">£{tierInfo.price}/mo</span>
                            </div>
                            <p className="text-sm text-gray-300 mb-3">{tierInfo.description}</p>
                            <div className="text-xs text-gray-400">
                              <div>📱 {accessSummary.accessibleGpts}/{accessSummary.totalGpts} GPTs</div>
                              <div>📚 {accessSummary.accessibleDocs}/{accessSummary.totalDocs} Playbooks</div>
                            </div>
                            {isCurrentTier && (
                              <div className="mt-2 text-xs font-medium text-green-400">
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
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">📊</span>
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
                          : 'bg-slate-700/30 border-slate-600'
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
                            <span className="text-sm text-gray-300">GPTs Access</span>
                            <span className="text-sm font-medium text-white">
                              {accessSummary.accessibleGpts}/{accessSummary.totalGpts}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Playbooks Access</span>
                            <span className="text-sm font-medium text-white">
                              {accessSummary.accessibleDocs}/{accessSummary.totalDocs}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-600">
                            <p className="text-xs text-gray-300">{accessSummary.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Quick Test Links */}
              <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <span className="mr-3">🧪</span>
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
        </div>
      </div>

      {/* Tier Change Confirmation Modal */}
      {confirmTierChange.isOpen && confirmTierChange.targetTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmTierChange({ isOpen: false, targetTier: null })} />
          <div className="relative bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="mr-3">⚠️</span>
              Confirm Tier Change
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Are you sure you want to switch to <strong className="text-white">{TIER_FEATURES[confirmTierChange.targetTier].name}</strong> tier?
              </p>
              
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-100">
                  <strong>Admin Testing Mode:</strong> This will instantly change your tier for testing purposes. 
                  Regular users go through Stripe payment flow.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Current Tier:</span>
                  <span className="font-medium text-white">{TIER_FEATURES[user?.user_tier || 'free'].name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">New Tier:</span>
                  <span className="font-medium text-purple-200">{TIER_FEATURES[confirmTierChange.targetTier].name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmTierChange({ isOpen: false, targetTier: null })}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-colors"
                disabled={switchingTier}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (confirmTierChange.targetTier) {
                    await handleTierChange(confirmTierChange.targetTier)
                    setConfirmTierChange({ isOpen: false, targetTier: null })
                  }
                }}
                disabled={switchingTier}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {switchingTier ? 'Switching...' : 'Confirm Change'}
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

      {/* Blog Preview Modal */}
      {showPreviewModal && previewBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreviewModal(false)} />
          <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                📝 Preview Generated Blog Post
              </h2>
            </div>
            
            {/* Blog Preview */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="max-w-4xl mx-auto">
                {/* Blog Title */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {previewBlog.title}
                </h1>
                
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {previewBlog.category}
                  </span>
                  <span>{previewBlog.read_time} min read</span>
                  <span>{previewBlog.word_count} words</span>
                </div>
                
                {/* Content */}
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    components={{
                      img: ({ src, alt }) => (
                        <img 
                          src={src} 
                          alt={alt} 
                          className="rounded-lg shadow-xl w-full my-6"
                          loading="eager"
                          onError={(e) => {
                            console.warn('Preview image failed to load:', src);
                          }}
                        />
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-bold mt-8 mb-4">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-purple-500 pl-4 my-6 italic text-gray-700">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => {
                        const isInternal = href?.startsWith('/') || href?.startsWith('#')
                        if (isInternal) {
                          return (
                            <Link 
                              href={href || '#'}
                              className="text-purple-600 hover:text-purple-700 underline transition-colors"
                            >
                              {children}
                            </Link>
                          )
                        }
                        return (
                          <a 
                            href={href}
                            className="text-purple-600 hover:text-purple-700 underline transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        )
                      },
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                      ),
                    }}
                  >
                    {previewBlog.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Review the content before publishing
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPreviewModal(false)
                      setPreviewBlog(null)
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('Saving blog post...', previewBlog)
                        
                        // Clean the blog post data to only include required fields
                        const cleanPost = {
                          title: previewBlog.title,
                          content: previewBlog.content,
                          slug: previewBlog.slug,
                          published_at: previewBlog.published_at,
                          meta_description: previewBlog.meta_description,
                          category: previewBlog.category,
                          read_time: previewBlog.read_time
                        }
                        
                        const result = await blogService.createPost(cleanPost)
                        
                        if (!result) {
                          throw new Error('Failed to save blog post - check console for details')
                        }
                        
                        console.log('Blog saved, refreshing posts...')
                        const posts = await blogService.getAllPosts(true)
                        setBlogPosts(posts)
                        setShowPreviewModal(false)
                        setPreviewBlog(null)
                        setBlogPrompt('')
                        setBlogKnowledge('')
                        showNotification('Success', 'Blog post saved successfully!', 'success')
                      } catch (error) {
                        console.error('Save error:', error)
                        showNotification('Error', error instanceof Error ? error.message : 'Failed to save blog post', 'error')
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Save Blog Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blog Generation Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !generatingBlog && setShowBlogModal(false)} />
          <div className="relative bg-gradient-to-br from-white via-purple-50/40 to-blue-50/60 rounded-2xl sm:rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl border border-purple-200/50 backdrop-blur-xl">
            {!generatingBlog ? (
              <div className="p-4 sm:p-6 lg:p-8">
                {/* Mobile-Optimized Header */}
                <div className="relative text-center mb-6 sm:mb-8">
                  {/* Smaller animated background elements for mobile */}
                  <div className="absolute inset-0 -z-10 hidden sm:block">
                    <div className="absolute top-0 left-1/4 w-16 sm:w-32 h-16 sm:h-32 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-4 sm:top-8 right-1/4 w-12 sm:w-24 h-12 sm:h-24 bg-pink-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                  
                  <div className="relative w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-500 border-2 sm:border-4 border-white/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl sm:rounded-3xl"></div>
                    <span className="text-2xl sm:text-3xl lg:text-4xl text-white drop-shadow-lg relative z-10">🤖</span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-4 tracking-tight">
                    AI Blog Generator
                  </h2>
                  <div className="w-16 sm:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-3 sm:mb-6"></div>
                  <p className="text-sm sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium px-2">
                    Create professional, <span className="text-purple-600 font-semibold">SEO-optimized</span> blog posts with AI-powered content generation and <span className="text-pink-600 font-semibold">custom DALL-E 3 images</span>
                  </p>
                </div>
                
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {/* Blog Topic/Prompt - Mobile-Optimized */}
                  <div className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-purple-200/50 hover:shadow-2xl hover:border-purple-300/70 transition-all duration-500 hover:bg-white/90">
                    <label className="flex items-start sm:items-center text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                      <div className="relative w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 lg:mr-5 shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl sm:rounded-2xl"></div>
                        <span className="text-white text-lg sm:text-xl lg:text-2xl relative z-10">💡</span>
                      </div>
                      <div className="flex-1">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block sm:inline">Blog Topic / Prompt</span>
                        <span className="text-red-500 ml-2 text-xl sm:text-2xl animate-pulse">*</span>
                      </div>
                    </label>
                    <div className="relative">
                      <textarea
                        value={blogPrompt}
                        onChange={(e) => setBlogPrompt(e.target.value)}
                        placeholder="e.g., Complete guide to Claude Code for developers - advanced features, tips, and real-world applications"
                        className="w-full p-3 sm:p-4 lg:p-6 border-2 border-gray-300/50 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-300 text-sm sm:text-base lg:text-lg placeholder-gray-400 hover:border-purple-300 bg-gradient-to-br from-white to-gray-50/50 shadow-inner resize-none"
                        rows={3}
                      />
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full opacity-70">
                        {blogPrompt.length}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-200/50">
                      <p className="text-xs sm:text-sm text-blue-800 flex items-start sm:items-center font-medium">
                        <span className="mr-2 sm:mr-3 flex-shrink-0">🎯</span>
                        <span><strong>Pro Tip:</strong> Be specific and detailed for better AI understanding and SEO optimization</span>
                      </p>
                    </div>
                  </div>

                  {/* Additional Context - Mobile-Optimized */}
                  <div className="group bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-purple-200/50 hover:shadow-2xl hover:border-purple-300/70 transition-all duration-500 hover:bg-white/90">
                    <label className="flex items-start sm:items-center text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                      <div className="relative w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 lg:mr-5 shadow-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl sm:rounded-2xl"></div>
                        <span className="text-white text-lg sm:text-xl lg:text-2xl relative z-10">📝</span>
                      </div>
                      <div className="flex-1">
                        <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent block sm:inline">Additional Context</span>
                        <span className="text-gray-500 ml-0 sm:ml-3 font-medium text-sm sm:text-lg block sm:inline">(Optional)</span>
                      </div>
                    </label>
                    <div className="relative">
                      <textarea
                        value={blogKnowledge}
                        onChange={(e) => setBlogKnowledge(e.target.value)}
                        placeholder="Specific features, comparisons, case studies, or expert insights to include in the blog post..."
                        className="w-full p-3 sm:p-4 lg:p-6 border-2 border-gray-300/50 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all duration-300 text-sm sm:text-base placeholder-gray-400 hover:border-emerald-300 bg-gradient-to-br from-white to-gray-50/50 shadow-inner resize-none"
                        rows={3}
                      />
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full opacity-70">
                        {blogKnowledge.length}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-200/50">
                      <p className="text-xs sm:text-sm text-green-800 flex items-start sm:items-center font-medium">
                        <span className="mr-2 sm:mr-3 flex-shrink-0">✨</span>
                        <span><strong>Enhancement:</strong> Add specific points, data, or unique angles to make your content stand out</span>
                      </p>
                    </div>
                  </div>

                  {/* Mobile-Optimized Options Section */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-purple-200/50 hover:shadow-2xl transition-all duration-500">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 mb-4 sm:mb-6 lg:mb-8 flex items-start sm:items-center">
                      <div className="relative w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 lg:mr-6 shadow-2xl flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl sm:rounded-2xl"></div>
                        <span className="text-white text-xl sm:text-2xl lg:text-3xl relative z-10">⚙️</span>
                      </div>
                      <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Generation Options</span>
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                      {/* Mobile-Optimized Web Search Option */}
                      <div className="group bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-green-200/50 hover:border-green-300 hover:shadow-lg transition-all duration-300">
                        <label className="flex items-start cursor-pointer">
                          <div className="relative mt-0.5 mr-3 sm:mr-4 lg:mr-6 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={includeWebSearch}
                              onChange={(e) => setIncludeWebSearch(e.target.checked)}
                              className="w-5 sm:w-6 h-5 sm:h-6 text-green-600 bg-white border-2 border-green-400 rounded-lg focus:ring-2 sm:focus:ring-4 focus:ring-green-500/20 transition-all duration-200 shadow-md"
                            />
                            <div className="absolute inset-0 bg-green-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200 -z-10"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-3">
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                                  <span className="text-white text-lg sm:text-xl">🌐</span>
                                </div>
                                <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Web Search Integration</span>
                              </div>
                              <span className="ml-0 sm:ml-3 px-2 sm:px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg self-start">Perplexity AI</span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">Gather latest information and current data from the web for more accurate, up-to-date content with real-time insights</p>
                          </div>
                        </label>
                      </div>
                      
                      {/* Mobile-Optimized Image Generation Option */}
                      <div className="group bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border-2 border-purple-200/50 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
                        <label className="flex items-start cursor-pointer">
                          <div className="relative mt-0.5 mr-3 sm:mr-4 lg:mr-6 flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={includeImages}
                              onChange={(e) => setIncludeImages(e.target.checked)}
                              className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600 bg-white border-2 border-purple-400 rounded-lg focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 shadow-md"
                            />
                            <div className="absolute inset-0 bg-purple-500/20 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200 -z-10"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-3">
                              <div className="flex items-center mb-2 sm:mb-0">
                                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                                  <span className="text-white text-lg sm:text-xl">🎨</span>
                                </div>
                                <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">AI Image Generation</span>
                              </div>
                              <span className="ml-0 sm:ml-3 px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg self-start">DALL-E 3</span>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">Create high-quality, contextual images that enhance your blog post and dramatically improve engagement</p>
                          </div>
                        </label>
                    
                        
                        {/* Mobile-Optimized Image Count Selection */}
                        {includeImages && (
                          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-purple-200/50">
                            <div className="mb-3 sm:mb-4">
                              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center">
                                <span className="mr-2">📊</span>
                                Number of images:
                              </h4>
                              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[1, 2, 3].map((count) => (
                                  <label key={count} className="group cursor-pointer">
                                    <input
                                      type="radio"
                                      name="imageCount"
                                      value={count}
                                      checked={imageCount === count}
                                      onChange={(e) => setImageCount(parseInt(e.target.value))}
                                      className="sr-only"
                                    />
                                    <div className={`relative p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 transition-all duration-300 text-center font-bold shadow-lg hover:shadow-xl transform hover:scale-105 ${
                                      imageCount === count 
                                        ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-purple-500/30' 
                                        : 'border-purple-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                                    }`}>
                                      <div className="text-lg sm:text-xl lg:text-2xl mb-1">{count === 1 ? '🖼️' : count === 2 ? '🖼️🖼️' : '🖼️🖼️🖼️'}</div>
                                      <div className="text-xs sm:text-sm">{count} image{count > 1 ? 's' : ''}</div>
                                      {imageCount === count && (
                                        <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-4 sm:w-6 h-4 sm:h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                          <span className="text-white text-xs font-bold">✓</span>
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-200/50">
                              <p className="text-xs sm:text-sm text-purple-800 flex items-start sm:items-center font-medium">
                                <span className="mr-2 sm:mr-3 flex-shrink-0">🎯</span>
                                <span><strong>Smart Distribution:</strong> Images are strategically placed throughout your blog for maximum engagement and visual appeal</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Optimized Info Box */}
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">
                    <div className="flex flex-col sm:flex-row items-start">
                      <div className="relative w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-0 sm:mr-4 lg:mr-6 shadow-2xl flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-xl sm:rounded-2xl"></div>
                        <span className="text-white text-xl sm:text-2xl lg:text-3xl relative z-10">💡</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Generation Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                            <div className="flex items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-blue-200/50">
                              <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md sm:rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <span className="text-white text-xs sm:text-sm">📝</span>
                              </div>
                              <div className="text-blue-900">
                                <div className="font-bold text-sm sm:text-base">Content</div>
                                <div className="text-xs sm:text-sm">2000-3000 words with SEO optimization</div>
                              </div>
                            </div>
                            <div className="flex items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-green-200/50">
                              <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md sm:rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <span className="text-white text-xs sm:text-sm">⚡</span>
                              </div>
                              <div className="text-green-900">
                                <div className="font-bold text-sm sm:text-base">Speed</div>
                                <div className="text-xs sm:text-sm">~30-60 seconds (without images)</div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                            <div className="flex items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-purple-200/50">
                              <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md sm:rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <span className="text-white text-xs sm:text-sm">🎨</span>
                              </div>
                              <div className="text-purple-900">
                                <div className="font-bold text-sm sm:text-base">Images</div>
                                <div className="text-xs sm:text-sm">~45 seconds per image (DALL-E 3)</div>
                              </div>
                            </div>
                            <div className="flex items-center p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-indigo-200/50">
                              <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-md sm:rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <span className="text-white text-xs sm:text-sm">🌐</span>
                              </div>
                              <div className="text-indigo-900">
                                <div className="font-bold text-sm sm:text-base">Web Search</div>
                                <div className="text-xs sm:text-sm">Latest data via Perplexity</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile-Optimized Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6 pt-4 sm:pt-6 lg:pt-8 border-t-2 border-gray-200/50">
                    <button
                      onClick={() => setShowBlogModal(false)}
                      className="group px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-gray-700 hover:text-gray-900 border-2 border-gray-300 rounded-xl sm:rounded-2xl hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg transition-all duration-300 font-bold flex items-center justify-center space-x-2 sm:space-x-3 text-sm sm:text-base lg:text-lg transform hover:scale-105"
                    >
                      <div className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <span className="text-white text-sm sm:text-base lg:text-lg">❌</span>
                      </div>
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!blogPrompt.trim()) {
                          showNotification('Error', 'Please enter a blog topic', 'error')
                          return
                        }
                        setGeneratingBlog(true)
                      }}
                      disabled={!blogPrompt.trim()}
                      className="group relative px-6 sm:px-8 lg:px-12 py-3 sm:py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-base lg:text-lg hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2 sm:space-x-3 lg:space-x-4 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-700 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative w-7 sm:w-8 lg:w-10 h-7 sm:h-8 lg:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                        <span className="text-lg sm:text-xl lg:text-2xl">🤖</span>
                      </div>
                      <span className="relative">Generate Blog Post</span>
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 bg-gradient-to-br from-slate-50 via-purple-50/60 to-blue-50/60">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      🎆 Generating Your Blog Post
                    </h2>
                    <p className="text-gray-600 text-lg">Please wait while we create your professional blog post with AI</p>
                  </div>
                  <BlogGenerationProgress
                  prompt={blogPrompt}
                  knowledgeBase={blogKnowledge}
                  includeWebSearch={includeWebSearch}
                  includeImages={includeImages}
                  imageCount={imageCount}
                  onComplete={async (blogPost) => {
                    try {
                      // Generate slug from title
                      const slug = blogPost.title
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '')
                      
                      // Store the blog post for preview
                      setPreviewBlog({
                        ...blogPost,
                        slug,
                        published_at: new Date().toISOString()
                      })
                      
                      // Close generation modal and show preview
                      setGeneratingBlog(false)
                      setShowBlogModal(false)
                      setShowPreviewModal(true)
                      
                    } catch (error) {
                      console.error('Error processing blog post:', error)
                      showNotification('Error', 'Failed to process blog post', 'error')
                      setGeneratingBlog(false)
                    }
                  }}
                  onError={(error) => {
                    showNotification('Error', error, 'error')
                    setGeneratingBlog(false)
                  }}
                  onCancel={() => {
                    setGeneratingBlog(false)
                  }}
                />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DarkThemeBackground>
  )
}

// ContentList Component
interface ContentListProps {
  title: string
  icon: string
  items: any[]
  onToggleFeature: (item: any) => void
  onDelete: (item: any) => void
}

function ContentList({ title, icon, items, onToggleFeature, onDelete }: ContentListProps) {
  return (
    <div className="bg-slate-800/60 rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="mr-3">{icon}</span>
        {title}
        <span className="ml-2 text-sm text-gray-400">({items.length})</span>
      </h3>

      {items.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white mb-1 truncate">{item.title}</h4>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                    {item.is_featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onToggleFeature(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.is_featured
                        ? 'text-yellow-400 hover:text-yellow-300'
                        : 'text-gray-400 hover:text-yellow-400'
                    }`}
                    title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg transition-colors"
                    title="Delete item"
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
          <div className="text-4xl mb-2">{icon}</div>
          <p className="text-gray-400">No items yet. Upload your first content!</p>
        </div>
      )}
    </div>
  )
}