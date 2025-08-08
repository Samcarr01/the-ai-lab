'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import Footer from '@/components/Footer'
import GradientBackground from '@/components/NetworkBackground'
import ScrollAnimation from '@/components/ScrollAnimation'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setIsSubmitted(true)
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({ name: '', email: '', subject: '', message: '' })
      }, 5000)

    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DarkThemeBackground>
      
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-2 border border-purple-200/30">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                thehackai
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-100 hover:text-purple-300 transition-colors">
                Home
              </Link>
              <Link href="/login" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="gradient-purple text-white px-5 py-2 rounded-full font-medium button-hover shadow-md">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 gradient-purple rounded-2xl mb-6 shadow-2xl animate-float">
                <span className="text-3xl">💬</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">
                Let's Connect
              </h1>
              <p className="text-xl text-gray-100 max-w-2xl mx-auto leading-relaxed">
                Have questions about our AI tools? Need help with your subscription? 
                Want to suggest new GPTs or playbooks? We'd love to hear from you!
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Contact Form */}
            <ScrollAnimation animation="slide-left" delay={100}>
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/30 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-white mb-6">Send us a message</h2>
                  
                  {error && (
                    <div className="mb-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 text-xl">❌</span>
                        <div>
                          <h3 className="font-medium text-red-200">Error</h3>
                          <p className="text-red-300 text-sm">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
                        <span className="text-2xl">✅</span>
                      </div>
                      <h3 className="text-xl font-semibold text-green-400 mb-2">Message Sent!</h3>
                      <p className="text-gray-300">Thank you for reaching out. We'll get back to you soon!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-400"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-gray-400"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-200 mb-2">
                          Subject *
                        </label>
                        <div className="relative">
                          <select
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-slate-700 text-gray-400">Select a topic</option>
                            <option value="subscription" className="bg-slate-700 text-white">Subscription & Billing</option>
                            <option value="technical" className="bg-slate-700 text-white">Technical Support</option>
                            <option value="content" className="bg-slate-700 text-white">Content Suggestions</option>
                            <option value="partnership" className="bg-slate-700 text-white">Partnership Inquiry</option>
                            <option value="feedback" className="bg-slate-700 text-white">Feedback & Reviews</option>
                            <option value="other" className="bg-slate-700 text-white">Other</option>
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-2">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none placeholder-gray-400"
                          placeholder="Tell us how we can help you..."
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full gradient-purple text-white px-8 py-4 rounded-xl font-semibold button-hover shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <span className="text-xl">🚀</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </ScrollAnimation>

            {/* Contact Info & Quick Links */}
            <ScrollAnimation animation="slide-right" delay={200}>
              <div className="space-y-8">
                
                {/* Quick Response */}
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/30 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">Quick Response</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      We typically respond within 24 hours. For urgent subscription issues, 
                      we'll get back to you even faster!
                    </p>
                  </div>
                </div>

                {/* Help Topics */}
                <div className="bg-slate-800/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-500/30 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💡</span>
                      </div>
                      <h3 className="text-xl font-semibold text-white">How can we help?</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-400">🔧</span>
                        <span className="text-gray-300">Technical support & troubleshooting</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-400">💳</span>
                        <span className="text-gray-300">Subscription & billing questions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-400">🎯</span>
                        <span className="text-gray-300">Content suggestions & requests</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-400">🤝</span>
                        <span className="text-gray-300">Partnership opportunities</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-400">⭐</span>
                        <span className="text-gray-300">Feedback & feature requests</span>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </ScrollAnimation>
          </div>

          {/* Bottom CTA */}
          <ScrollAnimation animation="scale" delay={300}>
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Ready to supercharge your AI workflow? 🚀
                  </h2>
                  <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                    Join hundreds of professionals using our curated AI tools and playbooks to accelerate their work.
                  </p>
                  <Link 
                    href="/signup" 
                    className="inline-flex items-center space-x-2 bg-slate-800/80 text-purple-400 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transform transition-all duration-300 shadow-lg"
                  >
                    <span>Start Free Account</span>
                    <span className="text-xl">✨</span>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </DarkThemeBackground>
  )
}