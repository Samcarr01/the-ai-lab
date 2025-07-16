'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'
import GradientBackground from '@/components/NetworkBackground'
import ScrollAnimation from '@/components/ScrollAnimation'
import AnimatedCounter from '@/components/AnimatedCounter'
import TypewriterText from '@/components/TypewriterText'
import PromptRefinerDemo from '@/components/PromptRefinerDemo'
import PlaybookFlipDemo from '@/components/PlaybookFlipDemo'
import InternalMobileNavigation from '@/components/InternalMobileNavigation'
import MobileNavigation from '@/components/MobileNavigation'

export default function HomePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  
  // Check authentication status and get user profile
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user: authUser } = await auth.getUser()
        if (authUser) {
          // Get user profile for Pro status
          let userProfile = await userService.getProfile(authUser.id)
          if (!userProfile) {
            userProfile = await userService.createProfile(authUser.id, authUser.email || '')
          }
          setUser(userProfile)
        } else {
          setUser(null)
        }
        
        // Load content stats
        const stats = await contentStatsService.getContentStats('free')
        setContentStats(stats)
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])
  
  const handleFeatureClick = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePricingClick = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white relative">
      {/* Animated Background */}
      <GradientBackground />
      {/* Navigation Header with Glassmorphism */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-white rounded-xl flex items-center justify-center shadow-lg animate-pulse-purple group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 p-1 border border-purple-200">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain logo-dark-purple-blue-glow"
                />
              </div>
              <span className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-300">
                thehackai
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a 
                href="#features" 
                className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 cursor-pointer font-medium group"
                onClick={(e) => {
                  e.preventDefault()
                  handleFeatureClick()
                }}
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a 
                href="#pricing" 
                className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 cursor-pointer font-medium group"
                onClick={(e) => {
                  e.preventDefault()
                  handlePricingClick()
                }}
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
              <Link 
                href="/blog" 
                className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 font-medium group"
              >
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              {loading ? (
                <div className="animate-pulse flex space-x-3">
                  <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-10 w-24 bg-gray-200 rounded-full"></div>
                </div>
              ) : user ? (
                <Link 
                  href="/dashboard" 
                  className="gradient-purple text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:rotate-1 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>Dashboard</span>
                    <span className="text-lg transform group-hover:translate-x-1 transition-transform duration-300">⚡</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="relative text-purple-600 font-medium hover:text-purple-700 transition-all duration-300 px-4 py-2 rounded-lg hover:bg-purple-50 group"
                  >
                    Sign In
                    <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-100 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                  </Link>
                  <Link 
                    href="/signup" 
                    className="gradient-purple text-white px-6 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:rotate-1 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center space-x-2">
                      <span>Get Started</span>
                      <span className="text-lg transform group-hover:translate-x-1 transition-transform duration-300">✨</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </>
              )}
            </nav>
            
            {/* Mobile Navigation */}
            {user ? (
              <InternalMobileNavigation 
                userEmail={user.email}
                userTier={user.user_tier || 'free'}
                showAdminLink={user.email === 'samcarr1232@gmail.com'}
                showSignOut={false}
              />
            ) : (
              <MobileNavigation 
                onFeatureClick={handleFeatureClick}
                onPricingClick={handlePricingClick}
              />
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollAnimation animation="fade-up">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full bg-purple-100/50 border border-purple-200/50">
            <div className="w-6 h-6 mr-2 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="thehackai logo"
                width={24}
                height={24}
                className="w-full h-full object-contain logo-dark-purple-blue-glow"
              />
            </div>
            <span className="text-purple-700 text-sm font-medium">Battle-tested AI Playbooks & GPTs</span>
          </div>
          
          <h1 className="text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight text-center min-h-[36px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px] xl:min-h-[100px] flex items-center justify-center px-1">
            <TypewriterText 
              texts={[
                "Battle-tested AI workflows",
                "Make any AI smarter instantly", 
                "Skip months of trial and error"
              ]}
              className="inline-block"
            />
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Skip months of trial and error. Access my personal collection 
            of proven GPTs and PDF playbooks you can upload directly to any LLM as knowledge. Choose from 
            <span className="text-purple-600 font-medium">Pro (£7/month)</span> or <span className="text-pink-600 font-medium">Ultra (£19/month)</span> — with free preview access.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/signup" 
              className="gradient-purple text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold button-hover shadow-xl flex items-center justify-center space-x-2 w-full sm:w-auto mobile-touch-target touch-feedback"
            >
              <span>Create Free Account</span>
              <span className="text-xl">🚀</span>
            </Link>
            <a 
              href="#features"
              className="bg-white text-purple-600 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto mobile-touch-target touch-feedback"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>See What's Inside</span>
              <span className="text-xl">👀</span>
            </a>
          </div>
          
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <span>🆓</span>
              <span>Free account required</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⚡</span>
              <span>Instant access</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>🚀</span>
              <span>Upgrade anytime</span>
            </div>
          </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                What&apos;s Inside thehackai 🚀
              </h2>
              <p className="text-xl text-gray-600">
                Create your free account to explore and upgrade anytime for full access
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature Card 1 */}
            <ScrollAnimation animation="fade-up" delay={100}>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100/50 hover:border-purple-300/50 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col touch-feedback">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 sm:w-16 h-14 sm:h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl animate-pulse transition-all duration-300">🤖</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Proven GPTs
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow mobile-readable">
                Specialized ChatGPT tools for business planning, productivity, and automation. Direct links to working GPTs.
              </p>
              <div className="text-sm sm:text-base text-purple-600 font-medium flex items-center space-x-2 mt-auto">
                <span><AnimatedCounter end={contentStats?.totalGPTs || 7} /> GPTs available</span>
                <span className="text-xl animate-pulse">→</span>
              </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Feature Card 2 */}
            <ScrollAnimation animation="fade-up" delay={200}>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100/50 hover:border-purple-300/50 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col touch-feedback">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 sm:w-16 h-14 sm:h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl animate-pulse transition-all duration-300">📚</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
                AI Playbooks
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow mobile-readable">
                Step-by-step PDF guides perfect for uploading to any LLM as knowledge. Upload these directly to ChatGPT, Claude, Gemini, or any AI to give it instant expertise in specific areas.
              </p>
              <div className="text-sm sm:text-base text-purple-600 font-medium flex items-center space-x-2 mt-auto">
                <span>{contentStats?.totalPlaybooks || 10} playbooks available</span>
                <span className="text-xl">→</span>
              </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Feature Card 3 */}
            <ScrollAnimation animation="fade-up" delay={300}>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100/50 hover:border-purple-300/50 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col touch-feedback">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 sm:w-16 h-14 sm:h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl animate-pulse transition-all duration-300">🎯</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
                Regular Updates
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow mobile-readable">
                New GPTs and playbooks added as I discover and test them. Quality over quantity approach.
              </p>
              <div className="text-sm sm:text-base text-purple-600 font-medium flex items-center space-x-2 mt-auto">
                <span>Continuous updates</span>
                <span className="text-xl">→</span>
              </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                See What You Get 🎯
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-2 sm:px-0">
                Experience the quality of our GPTs and playbooks
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Side - PromptRefiner Demo */}
            <ScrollAnimation animation="slide-left" delay={100}>
              <div className="h-auto min-h-[300px] md:min-h-[350px] lg:h-[400px]">
                <PromptRefinerDemo />
              </div>
            </ScrollAnimation>

            {/* Right Side - Playbook Flip Demo */}
            <ScrollAnimation animation="slide-right" delay={200}>
              <div className="h-auto min-h-[300px] md:min-h-[350px] lg:h-[400px]">
                <PlaybookFlipDemo />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollAnimation animation="fade-up">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              Choose Your AI Mastery Level 🚀
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 px-2 sm:px-0">
              Battle-tested AI playbooks and GPTs that actually work. Make any AI smarter at what you need.
            </p>
          </ScrollAnimation>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto pt-4">
            {/* Free Preview */}
            <ScrollAnimation animation="slide-left" delay={100}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-gray-300/50 transform hover:scale-105 hover:-translate-y-2 hover:-rotate-1 relative overflow-hidden h-full flex flex-col touch-feedback mt-4">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free Preview</h3>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-600 mb-4">£0</div>
                  <ul className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600 flex-grow">
                    <li className="flex items-center space-x-3">
                      <span className="text-green-500">✓</span>
                      <span>Browse all GPTs and playbooks</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-green-500">✓</span>
                      <span>Preview descriptions</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-green-500">✓</span>
                      <span>Access to blog content</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-green-500">✓</span>
                      <span>Explore what's inside</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
            
            {/* Pro Tier */}
            <ScrollAnimation animation="fade-up" delay={200}>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl text-white transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 relative overflow-visible h-full flex flex-col touch-feedback border-2 border-purple-300 mt-4">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-white text-purple-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">Most Popular</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Pro - Daily AI Use</h3>
                  <div className="text-3xl sm:text-4xl font-bold mb-4">£<AnimatedCounter end={7} duration={2500} className="inline" /><span className="text-lg sm:text-xl">/month</span></div>
                  <ul className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base flex-grow">
                    <li className="flex items-center space-x-3">
                      <span className="text-purple-200">✓</span>
                      <span>3 essential GPTs for daily productivity</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-purple-200">✓</span>
                      <span>2 core playbooks for any LLM</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-purple-200">✓</span>
                      <span>Email support</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-purple-200">✓</span>
                      <span>Perfect for getting started</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
            
            {/* Ultra Tier */}
            <ScrollAnimation animation="slide-right" delay={300}>
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 sm:p-8 shadow-xl hover:shadow-2xl text-white transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-visible h-full flex flex-col touch-feedback mt-4">
                {/* Traveling light segment around border */}
                <div className="absolute -inset-1 rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl" style={{
                    background: `conic-gradient(from 0deg, transparent 0%, transparent 85%, #ff69b4 90%, #8b5cf6 95%, transparent 100%)`,
                    animation: 'spin 3s linear infinite'
                  }}></div>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 z-10"></div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-white text-pink-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">Best Value</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Ultra - Upscale Your AI Game</h3>
                  <div className="text-3xl sm:text-4xl font-bold mb-4">£<AnimatedCounter end={19} duration={2500} className="inline" /><span className="text-lg sm:text-xl">/month</span></div>
                  <ul className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base flex-grow">
                    <li className="flex items-center space-x-3">
                      <span className="text-pink-200">✓</span>
                      <span>All {contentStats?.totalGPTs || 7} GPTs for complete AI mastery</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-pink-200">✓</span>
                      <span>All {contentStats?.totalPlaybooks || 10} playbooks for expert knowledge</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-pink-200">✓</span>
                      <span>Priority support + early access</span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-pink-200">✓</span>
                      <span>For serious AI power users</span>
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <ScrollAnimation animation="scale" delay={100}>
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden touch-feedback">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Hack Your AI? 🔓
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-6 sm:mb-8 px-2 sm:px-0">
            Make any AI smarter at what you need with our battle-tested playbooks and GPTs. Create your free account to explore!
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center space-x-2 bg-white text-purple-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold hover:scale-105 transform transition-all duration-300 shadow-lg mobile-touch-target touch-feedback"
          >
            <span>Create Free Account</span>
            <span className="text-xl">🚀</span>
          </Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain logo-dark-purple-blue-glow"
                />
              </div>
              <span className="text-base sm:text-lg font-semibold text-gray-900">thehackai</span>
            </div>
            <div className="flex space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-600">
              <Link href="/terms" className="hover:text-purple-600 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-purple-600 transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500 px-4 sm:px-0">
            © 2024 thehackai. Made with 💜 for AI enthusiasts.
          </div>
        </div>
      </footer>
    </div>
  )
}