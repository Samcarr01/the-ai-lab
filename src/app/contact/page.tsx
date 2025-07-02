'use client'

import { useState } from 'react'
import Link from 'next/link'
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setIsSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: '', email: '', subject: '', message: '' })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white relative">
      {/* Animated Background */}
      <GradientBackground />
      
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg animate-pulse-purple">
                <span className="text-white text-xl">🧪</span>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                The AI Lab
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-600 hover:text-purple-600 transition-colors">
                Home
              </Link>
              <Link href="/login" className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
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
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 gradient-purple rounded-2xl mb-6 shadow-2xl animate-float">
                <span className="text-3xl">💬</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Let's Connect
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Have questions about our AI tools? Need help with your subscription? 
                Want to suggest new GPTs or playbooks? We'd love to hear from you!
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Contact Form */}
            <ScrollAnimation animation="slide-left" delay={100}>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a message</h2>
                  
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <span className="text-2xl">✅</span>
                      </div>
                      <h3 className="text-xl font-semibold text-green-600 mb-2">Message Sent!</h3>
                      <p className="text-gray-600">Thank you for reaching out. We'll get back to you soon!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                          Subject *
                        </label>
                        <div className="relative">
                          <select
                            id="subject"
                            name="subject"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none bg-white cursor-pointer"
                          >
                            <option value="">Select a topic</option>
                            <option value="subscription">Subscription & Billing</option>
                            <option value="technical">Technical Support</option>
                            <option value="content">Content Suggestions</option>
                            <option value="partnership">Partnership Inquiry</option>
                            <option value="feedback">Feedback & Reviews</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
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
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">Quick Response</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      We typically respond within 24 hours. For urgent subscription issues, 
                      we'll get back to you even faster!
                    </p>
                  </div>
                </div>

                {/* Help Topics */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-purple-100/50 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">💡</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">How can we help?</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600">🔧</span>
                        <span className="text-gray-700">Technical support & troubleshooting</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600">💳</span>
                        <span className="text-gray-700">Subscription & billing questions</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600">🎯</span>
                        <span className="text-gray-700">Content suggestions & requests</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600">🤝</span>
                        <span className="text-gray-700">Partnership opportunities</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-purple-600">⭐</span>
                        <span className="text-gray-700">Feedback & feature requests</span>
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
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden">
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
                    className="inline-flex items-center space-x-2 bg-white text-purple-700 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transform transition-all duration-300 shadow-lg"
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
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <span className="text-2xl">🧪</span>
              <span className="text-lg font-semibold text-gray-900">The AI Lab</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-purple-600 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy</Link>
              <Link href="/contact" className="text-purple-600 font-medium">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2024 The AI Lab. Made with 💜 for AI enthusiasts.
          </div>
        </div>
      </footer>
    </div>
  )
}