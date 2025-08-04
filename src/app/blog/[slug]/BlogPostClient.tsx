'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SmartNavigation from '@/components/SmartNavigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogPost } from '@/lib/blog'
import { type UserProfile } from '@/lib/user'

// Icons for sharing and navigation
const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 2.684C18.114 12.938 18 12.482 18 12c0-.482.114-.938.316-1.342m0 2.684a3 3 0 110-2.684m-9.632 4.026C8.886 15.062 9 15.518 9 16c0 .482-.114.938-.316 1.342m0 0a3 3 0 11-5.368 0m5.368 0A3 3 0 018.684 13.342m9.632 4.026a3 3 0 11-5.368 0m5.368 0A3 3 0 0118.316 13.342" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

interface Props {
  post: BlogPost
  user: UserProfile | null
}

export default function BlogPostClient({ post, user }: Props) {
  const [readingProgress, setReadingProgress] = useState(0)
  const [showShareMenu, setShowShareMenu] = useState(false)

  // Calculate reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.pageYOffset / totalHeight) * 100
      setReadingProgress(Math.min(100, Math.max(0, progress)))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Share functions
  const shareOnTwitter = () => {
    const text = `Check out "${post.title}" on @thehackai`
    const url = `https://thehackai.com/blog/${post.slug}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnLinkedIn = () => {
    const url = `https://thehackai.com/blog/${post.slug}`
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`https://thehackai.com/blog/${post.slug}`)
    setShowShareMenu(false)
    // Could add a toast notification here
  }

  // Generate table of contents from content
  const generateTOC = () => {
    const headings = post.content.match(/^##\s+(.+)$/gm) || []
    return headings.map(heading => {
      const title = heading.replace(/^##\s+/, '')
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return { title, id }
    })
  }

  const toc = generateTOC()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900">
      <SmartNavigation user={user} currentPage="blog" />
      
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-400">
            <li>
              <Link href="/" className="hover:text-purple-400 transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-purple-400 transition-colors">
                Blog
              </Link>
            </li>
            <li>/</li>
            <li className="text-white font-medium truncate">{post.title}</li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-12">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 text-sm font-medium text-purple-200 bg-purple-900/30 rounded-full">
              {post.category}
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-300">
            <time className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.read_time} min read
            </span>
          </div>
        </header>

        {/* Table of Contents (for long posts) */}
        {toc.length > 3 && (
          <div className="mb-12 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Table of Contents</h2>
            <nav>
              <ul className="space-y-2">
                {toc.map((item, index) => (
                  <li key={index}>
                    <a 
                      href={`#${item.id}`}
                      className="text-gray-300 hover:text-purple-400 transition-colors"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom link renderer to handle internal/external links
              a: ({ href, children }) => {
                const isInternal = href?.startsWith('/') || href?.startsWith('#')
                if (isInternal) {
                  return (
                    <Link 
                      href={href || '#'}
                      className="text-purple-400 hover:text-purple-300 underline transition-colors"
                    >
                      {children}
                    </Link>
                  )
                }
                return (
                  <a 
                    href={href}
                    className="text-purple-400 hover:text-purple-300 underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                )
              },
              // Custom image renderer with stable display and table spacing
              img: ({ src, alt }) => {
                const [imageError, setImageError] = useState(false)
                
                return (
                  <figure className="my-8 clear-both"> {/* Added clear-both to prevent table overlap */}
                    {imageError ? (
                      <div className="w-full min-h-[300px] bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-700">
                        <div className="text-center text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Image temporarily unavailable</p>
                          {alt && <p className="text-xs mt-1 opacity-75">{alt}</p>}
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={src} 
                        alt={alt} 
                        className="rounded-lg shadow-xl w-full h-auto block" // Removed opacity transitions, added block and h-auto
                        loading="eager" // Changed back to eager for immediate visibility
                        style={{ minHeight: '200px' }} // Prevent layout shift
                        onError={(e) => {
                          console.warn('❌ Image failed to load:', src)
                          setImageError(true)
                        }}
                      />
                    )}
                    {alt && !imageError && <figcaption className="text-center text-sm text-gray-400 mt-3">{alt}</figcaption>}
                  </figure>
                )
              },
              // Custom code block renderer
              code: ({ children, ...props }) => {
                const isInline = !('className' in props && typeof props.className === 'string' && props.className.includes('language-'))
                if (isInline) {
                  return <code className="px-1 py-0.5 bg-gray-800 text-purple-300 rounded text-sm">{children}</code>
                }
                return (
                  <pre className="block p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto border border-gray-700">
                    <code>{children}</code>
                  </pre>
                )
              },
              // Custom blockquote renderer
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-500 pl-4 my-6 italic text-gray-300 bg-gray-800/30 py-2 rounded-r">
                  {children}
                </blockquote>
              ),
              // Custom table renderer with better spacing and float clearing
              table: ({ children }) => (
                <div className="overflow-x-auto my-8 clear-both"> {/* Added clear-both */}
                  <table className="min-w-full divide-y divide-gray-700 bg-gray-800 rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-700">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="bg-gray-800 divide-y divide-gray-700">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr>{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                  {children}
                </td>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 my-4 space-y-2 text-gray-300">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 my-4 space-y-2 text-gray-300">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-gray-300">{children}</li>
              ),
              p: ({ children }) => (
                <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-white">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-gray-200">{children}</em>
              ),
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-white mb-6">{children}</h1>
              ),
              h2: ({ children, ...props }) => {
                const text = Array.isArray(children) ? children.join('') : children?.toString() || ''
                const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                return <h2 id={id} className="text-2xl font-semibold text-white mb-4 mt-8 scroll-mt-20" {...props}>{children}</h2>
              },
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-white mb-3 mt-6">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-semibold text-white mb-2 mt-4">{children}</h4>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Share this article</h3>
            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-purple-400 transition-colors"
              >
                <ShareIcon />
                <span>Share</span>
              </button>
              
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10">
                  <button
                    onClick={shareOnTwitter}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <TwitterIcon />
                    <span>Share on Twitter</span>
                  </button>
                  <button
                    onClick={shareOnLinkedIn}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <LinkedInIcon />
                    <span>Share on LinkedIn</span>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-200 hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy link</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl text-white">
          <h3 className="text-2xl font-bold mb-3">Stay Updated with AI Insights</h3>
          <p className="text-purple-100 mb-6">
            Get the latest AI tools, strategies, and productivity tips delivered to your inbox.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Create Free Account
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Navigation to other posts */}
        <nav className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <Link 
              href="/blog"
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Blog</span>
            </Link>
            
            <Link 
              href="/gpts"
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>Explore AI Tools</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </nav>
      </article>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 thehackai. All rights reserved.</p>
            <div className="mt-4 flex items-center justify-center space-x-6">
              <Link href="/terms" className="hover:text-purple-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="hover:text-purple-400 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}