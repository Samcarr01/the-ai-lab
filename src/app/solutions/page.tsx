'use client'

// Force redeploy - Solutions page with animations
import DarkThemeBackground from '@/components/DarkThemeBackground'
import AnimatedCounter from '@/components/AnimatedCounter'
import ScrollAnimation from '@/components/ScrollAnimation'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { contentStatsService, type ContentStats } from '@/lib/content-stats'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'
import Footer from '@/components/Footer'
import SmartNavigation from '@/components/SmartNavigation'

export default function SolutionsPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [contentStats, setContentStats] = useState<ContentStats | null>(null)
  
  // Load user and content stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user
        const { user: authUser, error } = await auth.getUser()
        
        if (!error && authUser) {
          let userProfile = await userService.getProfile(authUser.id)
          if (!userProfile) {
            userProfile = await userService.createProfile(authUser.id, authUser.email || '')
          }
          setUser(userProfile)
        }

        // Load content stats
        const stats = await contentStatsService.getContentStats('ultra')
        setContentStats(stats)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])
  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} currentPage="solutions" />
      
      <div className="min-h-screen pt-16 sm:pt-20">
        {/* Problem-Focused Hero Section */}
        <section className="relative py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation>
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full text-red-300 text-sm font-medium border border-red-500/30 mb-6">
                  💡 Problems We Solve
                </span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
                  Stop Wasting Time on
                  <br />
                  <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                    Broken AI Tools
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Every day, professionals waste hours fighting with AI tools that don't work, following outdated guides, and getting mediocre results. <span className="text-purple-400 font-semibold">We've solved this problem.</span>
                </p>
              </div>
            </ScrollAnimation>

            {/* Before vs After Comparison */}
            <ScrollAnimation delay={0.2}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                {/* The Problem */}
                <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-2xl p-8">
                  <div className="text-red-400 text-5xl mb-6 text-center">😤</div>
                  <h3 className="text-2xl font-bold text-red-300 mb-6 text-center">Your Current Reality</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Spending 3+ hours tweaking prompts for basic tasks</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Following YouTube tutorials that don't work</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Getting inconsistent, mediocre AI results</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Paying for multiple AI tools that barely help</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Feeling frustrated and behind on AI adoption</p>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-red-900/30 rounded-lg border border-red-500/30">
                    <p className="text-red-200 text-center font-medium">
                      <span className="text-red-300 text-lg">💸</span> Average cost: <span className="font-bold">20+ hours/week</span> + <span className="font-bold">$200+/month</span> on tools that don't deliver
                    </p>
                  </div>
                </div>

                {/* The Solution */}
                <div className="bg-gradient-to-br from-green-900/20 to-purple-900/20 border border-green-500/30 rounded-2xl p-8">
                  <div className="text-green-400 text-5xl mb-6 text-center">🚀</div>
                  <h3 className="text-2xl font-bold text-green-300 mb-6 text-center">With thehackai</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Get expert results in under 5 minutes</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Access battle-tested GPTs that actually work</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Follow proven playbooks with guaranteed results</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">One platform, everything you need for £7-19/month</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Feel confident and ahead with AI workflows</p>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                    <p className="text-green-200 text-center font-medium">
                      <span className="text-green-300 text-lg">💰</span> Your new reality: <span className="font-bold">2 hours/week</span> + <span className="font-bold">£7-19/month</span> for expert AI results
                    </p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent to-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <ScrollAnimation>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  Real Results from
                  <span className="text-purple-400"> Real People</span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
                  See how professionals are using our GPTs and playbooks to save time, increase quality, and get ahead with AI.
                </p>
              </div>
            </ScrollAnimation>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 px-4 sm:px-0">
              <ScrollAnimation delay={0.1}>
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 sm:p-8">
                  <div className="text-red-400 text-4xl mb-4">❌</div>
                  <h3 className="text-xl font-bold text-white mb-3 text-center">Marketing Manager Sarah</h3>
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm mb-3">
                      <span className="text-red-300">"I was spending 6 hours a week writing social media posts and email campaigns. The results were inconsistent and I felt like I was falling behind."</span>
                    </p>
                    <div className="h-px bg-gradient-to-r from-red-500/30 to-orange-500/30 mb-3"></div>
                    <p className="text-gray-300 text-sm">
                      <span className="text-green-300">"With thehackai's Content Creation GPT, I now produce a week's worth of content in 30 minutes. Quality is 10x better and I'm finally ahead of the game."</span>
                    </p>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-green-300 text-sm font-medium">💰 Saved 5.5 hours/week</p>
                    <p className="text-green-300 text-sm font-medium">📈 10x better quality</p>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation delay={0.2}>
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 sm:p-8">
                  <div className="text-green-400 text-4xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-white mb-3 text-center">Consultant Mike</h3>
                  <div className="mb-4">
                    <p className="text-gray-300 text-sm mb-3">
                      <span className="text-red-300">"Creating client reports took me 8 hours per project. I was working nights and weekends just to keep up with demand."</span>
                    </p>
                    <div className="h-px bg-gradient-to-r from-green-500/30 to-teal-500/30 mb-3"></div>
                    <p className="text-gray-300 text-sm">
                      <span className="text-green-300">"Now I use the Report Writing playbook and finish reports in 45 minutes. Clients love the quality and I've doubled my client load."</span>
                    </p>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-green-300 text-sm font-medium">💰 2x more clients</p>
                    <p className="text-green-300 text-sm font-medium">⏰ 90% time saved</p>
                  </div>
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
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10 h-full transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                          🤖
                        </div>
                        <div className="ml-4">
                          <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                            Premium GPTs
                          </h3>
                          <p className="text-purple-400 font-medium group-hover:animate-pulse">Updated Weekly</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-6 leading-relaxed">
                        Specialized ChatGPT tools designed for real work scenarios. From business planning to content creation, these GPTs handle complex tasks that boost your daily productivity.
                      </p>
                      <div className="space-y-3 text-sm text-gray-400">
                        <div className="flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          Business planning and strategy tools
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          Content creation and marketing GPTs
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          Productivity and workflow automation
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-400 mr-2">✓</span>
                          Ready-to-use for immediate results
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollAnimation>

              <ScrollAnimation delay={0.2}>
                <Link href="/documents" className="group">
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-pink-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-pink-500/10 h-full transform hover:scale-105 hover:-translate-y-2 hover:-rotate-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-cyan-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                          📚
                        </div>
                        <div className="ml-4">
                          <h3 className="text-2xl font-bold text-white group-hover:text-pink-300 transition-colors">
                            AI Playbooks
                          </h3>
                          <p className="text-pink-400 font-medium group-hover:animate-pulse">Constantly Updated</p>
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
                  </div>
                </Link>
              </ScrollAnimation>

              <ScrollAnimation delay={0.3}>
                <Link href="/blog" className="group">
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/10 h-full transform hover:scale-105 hover:-translate-y-2 hover:rotate-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                          📝
                        </div>
                        <div className="ml-4">
                          <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                            AI Insights Blog
                          </h3>
                          <p className="text-cyan-400 font-medium group-hover:animate-pulse">Fresh Content</p>
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
                  </div>
                </Link>
              </ScrollAnimation>

              <ScrollAnimation delay={0.4}>
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-yellow-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-yellow-500/10 transform hover:scale-105 hover:-translate-y-2 hover:-rotate-1 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-180 transition-all duration-500">
                        🔄
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-bold text-white">
                          Living Library
                        </h3>
                        <p className="text-yellow-400 font-medium group-hover:animate-pulse">Always Growing</p>
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
                    One subscription replaces multiple tool subscriptions. Get access to <span className="text-cyan-400 font-semibold">{(contentStats?.totalGPTs || 7) + (contentStats?.totalPlaybooks || 4)}+</span> premium resources starting from just £7/month.
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

      {/* Footer */}
      <Footer />
    </DarkThemeBackground>
  )
}