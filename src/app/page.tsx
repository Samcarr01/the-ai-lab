'use client'

import Link from 'next/link'
import GradientBackground from '@/components/NetworkBackground'
import ScrollAnimation from '@/components/ScrollAnimation'
import AnimatedCounter from '@/components/AnimatedCounter'
import TypewriterText from '@/components/TypewriterText'
import PromptRefinerDemo from '@/components/PromptRefinerDemo'
import PlaybookFlipDemo from '@/components/PlaybookFlipDemo'
import MobileNavigation from '@/components/MobileNavigation'

export default function HomePage() {
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg animate-pulse-purple">
                <span className="text-white text-xl">🧪</span>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                The AI Lab
              </span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  handleFeatureClick()
                }}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  handlePricingClick()
                }}
              >
                Pricing
              </a>
              <Link href="/blog" className="text-gray-600 hover:text-purple-600 transition-colors">
                Blog
              </Link>
              <Link 
                href="/login" 
                className="text-purple-600 font-medium hover:text-purple-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="gradient-purple text-white px-5 py-2 rounded-full font-medium button-hover shadow-md"
              >
                Get Started
              </Link>
            </nav>
            
            {/* Mobile Navigation */}
            <MobileNavigation 
              onFeatureClick={handleFeatureClick}
              onPricingClick={handlePricingClick}
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollAnimation animation="fade-up">
          <div className="inline-flex items-center justify-center px-4 py-2 mb-8 rounded-full bg-purple-100/50 border border-purple-200/50">
            <span className="text-purple-700 text-sm font-medium">🧪 Curated AI Tools & Playbooks</span>
          </div>
          
          <h1 className="text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight text-center min-h-[36px] sm:min-h-[70px] md:min-h-[80px] lg:min-h-[90px] xl:min-h-[100px] flex items-center justify-center px-1">
            <TypewriterText 
              texts={[
                "Battle-tested AI workflows",
                "Proven GPT collections", 
                "Ready-to-use playbooks"
              ]}
              className="inline-block"
            />
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Skip months of trial and error. Access my personal collection 
            of proven GPTs and PDF playbooks you can upload directly to ChatGPT, Claude, or any LLM as knowledge for 
            <span className="text-purple-600 font-medium">£15/month</span> — with free preview access.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/signup" 
              className="gradient-purple text-white px-8 py-4 rounded-full text-lg font-semibold button-hover shadow-xl flex items-center space-x-2"
            >
              <span>Create Free Account</span>
              <span className="text-xl">🚀</span>
            </Link>
            <a 
              href="#features"
              className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 flex items-center space-x-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>See What's Inside</span>
              <span className="text-xl">👀</span>
            </a>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
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
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                What&apos;s Inside The Lab 🧬
              </h2>
              <p className="text-xl text-gray-600">
                Create your free account to explore and upgrade anytime for full access
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <ScrollAnimation animation="fade-up" delay={100}>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100/50 hover:border-purple-300/50 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl animate-pulse transition-all duration-300">🤖</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Proven GPTs
              </h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Specialized ChatGPT tools for business planning, productivity, and automation. Direct links to working GPTs.
              </p>
              <div className="text-purple-600 font-medium flex items-center space-x-2 mt-auto">
                <span><AnimatedCounter end={7} /> GPTs available</span>
                <span className="text-xl animate-pulse">→</span>
              </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Feature Card 2 */}
            <ScrollAnimation animation="fade-up" delay={200}>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100/50 hover:border-purple-300/50 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl animate-pulse transition-all duration-300">📚</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                AI Playbooks
              </h3>
              <p className="text-gray-600 mb-4 flex-grow">
                Step-by-step PDF guides perfect for uploading to ChatGPT, Claude, or any LLM as knowledge. Upload these directly to give your AI instant expertise in specific areas.
              </p>
              <div className="text-purple-600 font-medium flex items-center space-x-2 mt-auto">
                <span>Growing collection</span>
                <span className="text-xl">→</span>
              </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Feature Card 3 */}
            <ScrollAnimation animation="fade-up" delay={300}>
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-purple-100/50 hover:border-purple-300/50 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <div className="w-16 h-16 gradient-purple-subtle rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl animate-pulse transition-all duration-300">🎯</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Regular Updates
              </h3>
              <p className="text-gray-600 mb-4 flex-grow">
                New GPTs and playbooks added as I discover and test them. Quality over quantity approach.
              </p>
              <div className="text-purple-600 font-medium flex items-center space-x-2 mt-auto">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                See What You Get 🎯
              </h2>
              <p className="text-xl text-gray-600">
                Experience the quality of our GPTs and playbooks
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid lg:grid-cols-2 gap-8">
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
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollAnimation animation="fade-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Honest Pricing 💜
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Create a free account to explore, then upgrade for full access
            </p>
          </ScrollAnimation>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <ScrollAnimation animation="slide-left" delay={100}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 hover:border-gray-300/50 transform hover:scale-105 hover:-translate-y-2 hover:-rotate-1 relative overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Preview</h3>
              <div className="text-4xl font-bold text-gray-600 mb-4">£0</div>
              <ul className="text-left space-y-3 text-gray-600 flex-grow">
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
              </ul>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation animation="slide-right" delay={200}>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 shadow-xl hover:shadow-2xl text-white transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-2xl font-bold mb-2">Pro Access</h3>
              <div className="text-4xl font-bold mb-4">£15<span className="text-xl">/month</span></div>
              <ul className="text-left space-y-3 flex-grow">
                <li className="flex items-center space-x-3">
                  <span className="text-purple-200">✓</span>
                  <span>Direct links to all GPTs</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="text-purple-200">✓</span>
                  <span>Download PDF playbooks for LLM knowledge</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="text-purple-200">✓</span>
                  <span>New content as it's added</span>
                </li>
              </ul>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <ScrollAnimation animation="scale" delay={100}>
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Join The Lab? 🚀
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Create your free account now and start exploring. Upgrade to Pro for full access to everything.
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center space-x-2 bg-white text-purple-700 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transform transition-all duration-300 shadow-lg"
          >
            <span>Create Free Account</span>
            <span className="text-xl">🚀</span>
          </Link>
            </div>
          </div>
        </ScrollAnimation>
      </section>

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
              <Link href="/contact" className="hover:text-purple-600 transition-colors">Contact</Link>
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