import DarkThemeBackground from '@/components/DarkThemeBackground'
import AnimatedCounter from '@/components/AnimatedCounter'
import ScrollAnimation from '@/components/ScrollAnimation'
import Link from 'next/link'
import Image from 'next/image'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'

export default async function SolutionsPage() {
  // Load content stats for dynamic numbers
  const contentStats = await contentStatsService.getContentStats('free')
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
                
                <button
                  onClick={() => window.location.href = '/#features'}
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">⚡</span>
                    <span>Features</span>
                  </div>
                </button>
                
                <button
                  onClick={() => window.location.href = '/#pricing'}
                  className="px-4 py-2.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">💰</span>
                    <span>Pricing</span>
                  </div>
                </button>
                
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
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight">
                  Make any AI smarter
                  <br />
                  instantly
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
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 text-center mobile-touch-target"
                >
                  Explore GPTs
                </Link>
                <Link 
                  href="/documents"
                  className="px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 text-center mobile-touch-target"
                >
                  View Playbooks
                </Link>
              </div>
            </ScrollAnimation>

            {/* Stats */}
            <ScrollAnimation delay={0.3}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    <AnimatedCounter end={(contentStats?.totalGPTs || 7) + (contentStats?.totalPlaybooks || 10)} duration={2000} />+
                  </div>
                  <p className="text-gray-400">Premium AI Tools</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-pink-400 mb-2">
                    <AnimatedCounter end={100} duration={2500} />%
                  </div>
                  <p className="text-gray-400">Battle-Tested</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">
                    Weekly
                  </div>
                  <p className="text-gray-400">Fresh Updates</p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Problems We Solve */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  Stop Wasting Time on
                  <span className="text-red-400"> Broken AI Tools</span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
                  We've all been there - spending hours trying AI tools that don't work, following outdated guides, or getting mediocre results. We solve that.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 px-4 sm:px-0">
              <ScrollAnimation delay={0.1}>
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sm:p-8">
                  <div className="text-red-400 text-4xl mb-4">❌</div>
                  <h3 className="text-2xl font-bold text-white mb-4">The Old Way</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      Hours searching for "the best AI tool"
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      Following outdated tutorials from 2022
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      Trying 10+ tools that don't work
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      Getting mediocre results
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      Paying for multiple subscriptions
                    </li>
                  </ul>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={0.2}>
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 sm:p-8">
                  <div className="text-green-400 text-4xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-white mb-4">The thehackai Way</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      Get the exact tools that work (tested by us)
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      Always current - updated weekly
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      Skip to the tools that actually deliver
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      Professional-grade results immediately
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      One subscription, all the best tools
                    </li>
                  </ul>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Our Solutions */}
        <section id="features" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  How We Keep You
                  <span className="text-purple-400"> Ahead of the Curve</span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
                  Our solutions are designed to save you time, money, and frustration while delivering professional results.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-4 sm:px-0">
              <ScrollAnimation delay={0.1}>
                <Link href="/gpts" className="group">
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 h-full">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl">
                        🤖
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                          Premium GPTs
                        </h3>
                        <p className="text-purple-400 font-medium">Updated Weekly</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Hand-picked ChatGPT tools that actually work. Each GPT is personally tested, optimized, and comes with detailed usage guides.
                    </p>
                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Personal testing on every GPT
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        New GPTs added weekly
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Direct ChatGPT links for Pro users
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Organized by category and use case
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollAnimation>

              <ScrollAnimation delay={0.2}>
                <Link href="/documents" className="group">
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 h-full">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-cyan-600 rounded-xl flex items-center justify-center text-2xl">
                        📚
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-white group-hover:text-pink-300 transition-colors">
                          AI Playbooks
                        </h3>
                        <p className="text-pink-400 font-medium">Constantly Updated</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Upload these playbooks to any AI and watch it become an expert instantly. Each playbook contains months of research and proven strategies — giving AI knowledge it doesn't have to tackle complex tasks.
                    </p>
                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Months of research condensed into one file
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Upload to ChatGPT, Claude, or any AI
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Turn AI into an instant expert
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Skip the learning curve completely
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollAnimation>

              <ScrollAnimation delay={0.3}>
                <Link href="/blog" className="group">
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 h-full">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                        📝
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                          AI Insights Blog
                        </h3>
                        <p className="text-cyan-400 font-medium">Fresh Content</p>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      Stay ahead with the latest AI trends, tool reviews, and practical insights. Free access to our growing knowledge base.
                    </p>
                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Weekly AI industry insights
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Tool reviews and comparisons
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Free access for everyone
                      </div>
                      <div className="flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        SEO-optimized for discoverability
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollAnimation>

              <ScrollAnimation delay={0.4}>
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center text-2xl">
                      🔄
                    </div>
                    <div className="ml-4">
                      <h3 className="text-2xl font-bold text-white">
                        Living Library
                      </h3>
                      <p className="text-yellow-400 font-medium">Always Growing</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Your subscription gets better over time. We continuously add new tools, update existing content, and expand the library.
                  </p>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      New tools added every week
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Content updated when AI evolves
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      Community feedback integration
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      No extra cost for new additions
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-purple-900/20 to-transparent">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollAnimation>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                Why Choose thehackai?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-purple-400 mb-4">🎯 Personally Tested</h3>
                  <p className="text-gray-300">
                    Every single GPT and playbook goes through rigorous testing. We don't add anything that doesn't deliver real value.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-pink-400 mb-4">⚡ Always Current</h3>
                  <p className="text-gray-300">
                    AI moves fast. We update content weekly, retire outdated tools, and keep everything fresh and relevant.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4">💰 Cost Effective</h3>
                  <p className="text-gray-300">
                    One subscription replaces multiple tool subscriptions. Get access to {(contentStats?.totalGPTs || 7) + (contentStats?.totalPlaybooks || 10)}+ premium resources starting from just £7/month.
                  </p>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-green-400 mb-4">🚀 Results Focused</h3>
                  <p className="text-gray-300">
                    We curate for results, not quantity. Every tool saves you time and delivers professional-grade output.
                  </p>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={0.2}>
              <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-12 mx-4 sm:mx-0">
                <h3 className="text-3xl font-bold text-white mb-4">
                  Ready to Stop Wasting Time?
                </h3>
                <p className="text-lg sm:text-xl text-purple-200 mb-6">
                  Join professionals who've already made the switch to curated, tested AI workflows.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/signup"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 text-center mobile-touch-target"
                  >
                    Start Free Account
                  </Link>
                  <Link 
                    href="/blog"
                    className="px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-300 text-center mobile-touch-target"
                  >
                    Read Our Blog
                  </Link>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>
      </div>
    </DarkThemeBackground>
  )
}