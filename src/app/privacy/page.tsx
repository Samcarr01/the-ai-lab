import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import Footer from '@/components/Footer'
import SmartNavigation from '@/components/SmartNavigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'

'use client'

export default function PrivacyPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { user: authUser, error } = await auth.getUser()
        
        if (!error && authUser) {
          let userProfile = await userService.getProfile(authUser.id)
          if (!userProfile) {
            userProfile = await userService.createProfile(authUser.id, authUser.email || '')
          }
          setUser(userProfile)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  return (
    <DarkThemeBackground>
      <SmartNavigation user={user} currentPage="privacy" />

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-100">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="bg-slate-800/80/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100/50">
            <div className="prose prose-lg max-w-none">
              
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                We collect information you provide directly to us, such as when you create an account, subscribe to our service, or contact us for support.
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li><strong>Account Information:</strong> Email address, password, and subscription status</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we don't store payment details)</li>
                <li><strong>Usage Data:</strong> Pages visited, content accessed, and feature usage</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and session data</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services:
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li>Provide access to GPTs and playbooks based on your subscription</li>
                <li>Process payments and manage your subscription</li>
                <li>Send important service updates and notifications</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our service and develop new features</li>
                <li>Ensure security and prevent fraud</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">3. Information Sharing</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li><strong>Payment Processing:</strong> Stripe processes payments on our behalf</li>
                <li><strong>Service Providers:</strong> Trusted partners who help operate our service (Supabase, Vercel)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfer:</strong> In the event of a merger, acquisition, or sale of assets</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits. 
                However, no method of transmission over the internet is 100% secure.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide you services. 
                We will retain and use your information as necessary to comply with legal obligations, resolve disputes, 
                and enforce our agreements.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                You have certain rights regarding your personal information:
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your personal data</li>
                <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic site functionality and authentication</li>
                <li><strong>Analytics:</strong> Help us understand how users interact with our service</li>
                <li><strong>Preferences:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="mb-6 text-gray-700 leading-relaxed">
                You can control cookies through your browser settings, but this may affect site functionality.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Services</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                Our service integrates with third-party services that have their own privacy policies:
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li><strong>Stripe:</strong> Payment processing and subscription management</li>
                <li><strong>Supabase:</strong> Database and authentication services</li>
                <li><strong>Vercel:</strong> Website hosting and content delivery</li>
                <li><strong>OpenAI/ChatGPT:</strong> Links to external GPT tools (their privacy policies apply)</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">9. International Transfers</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy 
                and applicable data protection laws.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                Our service is not intended for children under 16 years of age. We do not knowingly collect personal 
                information from children under 16. If we become aware that we have collected personal information from 
                a child under 16, we will take steps to delete such information.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">11. Updates to This Policy</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the 
                new privacy policy on this page and updating the "Last updated" date. We encourage you to review this 
                policy periodically for any changes.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                If you have any questions about this privacy policy or our privacy practices, please contact us through our 
                <Link href="/contact" className="text-purple-400 hover:text-purple-300 font-medium"> contact page</Link> or 
                email us directly.
              </p>

            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-12 text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <Link 
                href="/terms" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                href="/contact" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Contact Us
              </Link>
              <Link 
                href="/" 
                className="gradient-purple text-white px-6 py-3 rounded-full font-medium button-hover shadow-md"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </DarkThemeBackground>
  )
}