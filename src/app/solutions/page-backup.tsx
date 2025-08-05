'use client'

// Force redeploy - Solutions page with animations
import DarkThemeBackground from '@/components/DarkThemeBackground'
import AnimatedCounter from '@/components/AnimatedCounter'
import ScrollAnimation from '@/components/ScrollAnimation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'

export default function SolutionsPage() {
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  
  // Load content stats on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await contentStatsService.getContentStats('free')
        setContentStats(stats)
      } catch (error) {
        console.error('Failed to load content stats:', error)
      }
    }
    loadStats()
  }, [])
  return (
    <DarkThemeBackground>
      {/* Navigation matching homepage exactly */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                thehackai
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              <nav className="flex items-center space-x-1 mr-6">
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">🏠</span>
                    <span>Home</span>
                  </div>
                </Link>
                
                <Link
                  href="/#features"
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">⚡</span>
                    <span>Features</span>
                  </div>
                </Link>
                
                <Link
                  href="/#pricing"
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">💰</span>
                    <span>Pricing</span>
                  </div>
                </Link>
                
                <Link
                  href="/blog"
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">✍️</span>
                    <span>Blogs</span>
                  </div>
                </Link>
              </nav>
              
              {/* Auth Actions */}
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">🔑</span>
                    <span>Sign In</span>
                  </div>
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">🚀</span>
                    <span>Get Started</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-semibold text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <div className="min-h-screen pt-16 sm:pt-20">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <ScrollAnimation>
              <div className="mb-8">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full text-purple-300 text-sm font-medium border border-purple-500/30 mb-6">
                  🚀 Battle-tested AI Playbooks & GPTs
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight hover:scale-105 transition-transform duration-500">
                  <span className="inline-block hover:animate-pulse">Make any AI smarter</span>
                  <br />
                  <span className="inline-block hover:animate-bounce">instantly</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-2 sm:px-0">
                  Skip months of trial and error. Our <span className="text-purple-400 font-semibold">proven GPTs</span> and <span className="text-pink-400 font-semibold">playbooks give AI knowledge it doesn't have</span> — so you get expert results immediately.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4 sm:px-0">
                <Link 
                  href="/gpts"
                  className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 text-center mobile-touch-target relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 group-hover:animate-pulse">Explore GPTs</span>
                </Link>
                <Link 
                  href="/documents"
                  className="group px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 hover:scale-105 text-center mobile-touch-target relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 group-hover:animate-pulse">View Playbooks</span>
                </Link>
              </div>
            </ScrollAnimation>

            {/* Stats with floating animation */}
            <ScrollAnimation delay={0.3}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
                <div className="text-center group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                    <div className="relative text-4xl font-bold text-purple-400 mb-2 transform group-hover:scale-110 transition-all duration-300">
                      <AnimatedCounter end={(contentStats?.totalGPTs || 7) + (contentStats?.totalPlaybooks || 10)} duration={2000} />+
                    </div>
                  </div>
                  <p className="text-gray-400">Premium AI Tools</p>
                </div>
                <div className="text-center group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                    <div className="relative text-4xl font-bold text-pink-400 mb-2 transform group-hover:scale-110 transition-all duration-300">
                      <AnimatedCounter end={100} duration={2500} />%
                    </div>
                  </div>
                  <p className="text-gray-400">Battle-Tested</p>
                </div>
                <div className="text-center group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
                    <div className="relative text-4xl font-bold text-cyan-400 mb-2 transform group-hover:scale-110 transition-all duration-300">
                      Weekly
                    </div>
                  </div>
                  <p className="text-gray-400">Fresh Updates</p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Simple test section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Solutions Page Is Working!</h2>
            <p className="text-xl text-gray-300">
              Current tool count: <span className="text-purple-400 font-semibold">{(contentStats?.totalGPTs || 7) + (contentStats?.totalPlaybooks || 10)}</span> tools
            </p>
            <p className="text-lg text-gray-400 mt-4">
              GPTs: {contentStats?.totalGPTs || 7} | Playbooks: {contentStats?.totalPlaybooks || 10}
            </p>
          </div>
        </section>
      </div>
    </DarkThemeBackground>
  )
}