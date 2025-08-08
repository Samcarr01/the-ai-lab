'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import DarkThemeBackground from '@/components/DarkThemeBackground'
import Footer from '@/components/Footer'
import SmartNavigation from '@/components/SmartNavigation'
import { auth } from '@/lib/auth'
import { userService, type UserProfile } from '@/lib/user'

export default function TermsPage() {
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
      <SmartNavigation user={user} currentPage="terms" />

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Terms of Service
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
              
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                By accessing and using thehackai service, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                thehackai provides access to curated AI tools, GPTs, and PDF playbooks through Pro (£7/month) and Ultra (£19/month) subscription plans. 
                Free accounts have preview access to browse content titles and descriptions.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                You must create an account to access our services. You are responsible for maintaining the confidentiality of your 
                account credentials and for all activities that occur under your account.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription and Payment</h2>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li>Pro subscriptions are billed monthly at £7</li>
                <li>Ultra subscriptions are billed monthly at £19</li>
                <li>Payment is processed through Stripe</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>No refunds for partial months</li>
                <li>You may cancel your subscription at any time</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">5. Content Usage and Restrictions</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                The GPTs and playbooks provided are for your personal and business use only. Content is provided "as is" without warranty.
              </p>
              <p className="mb-2 text-white font-semibold">STRICTLY PROHIBITED:</p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2 ml-4">
                <li><strong>Redistribution:</strong> You may not share, distribute, or republish any GPTs or playbooks</li>
                <li><strong>Commercial Resale:</strong> You may not sell, license, or monetize any content from this platform</li>
                <li><strong>Account Sharing:</strong> You may not share your account credentials or allow others to access your account</li>
                <li><strong>File Sharing:</strong> You may not upload content to file-sharing platforms or cloud storage for others to access</li>
                <li><strong>Public Distribution:</strong> You may not post content on social media, forums, or any public platforms</li>
                <li><strong>Team Distribution:</strong> You may not distribute content to team members, colleagues, or business partners without individual subscriptions</li>
              </ul>
              <p className="mb-6 text-gray-700 leading-relaxed">
                <strong>Violation of these restrictions will result in immediate account termination and may result in legal action.</strong>
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">6. Additional Prohibited Uses</h2>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li>Attempting to circumvent payment systems or access restrictions</li>
                <li>Using content for illegal or harmful purposes</li>
                <li>Reverse engineering or copying our service infrastructure</li>
                <li>Creating derivative works from our proprietary content</li>
                <li>Using automated tools to scrape or download content</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property and Licensing</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                All content, including GPTs, playbooks, and service materials, remain the exclusive property of thehackai. 
                You receive a limited, non-transferable license to use the content solely for your personal and business purposes.
              </p>
              <p className="mb-6 text-gray-700 leading-relaxed">
                <strong>This license does not grant you any rights to:</strong> reproduce, distribute, display publicly, 
                create derivative works, or commercially exploit any content. The license terminates immediately upon 
                violation of these terms or cancellation of your subscription.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                thehackai shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the service. Our liability is limited to the amount you paid for the service.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">9. Content Protection and Enforcement</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                We actively monitor and protect our intellectual property. We employ various technical and legal measures to detect 
                unauthorized distribution of our content.
              </p>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li>Content is watermarked and tracked for unauthorized distribution</li>
                <li>We monitor file-sharing platforms and social media for our content</li>
                <li>We may pursue legal action against violators including claims for damages</li>
                <li>We cooperate with platforms to remove unauthorized content</li>
              </ul>

              <h2 className="text-2xl font-semibold text-white mb-4">10. Account Termination</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe 
                violates these Terms of Service, including content sharing violations, or is harmful to other users or the service.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes 
                via email or through the service. Continued use after changes constitutes acceptance.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the United Kingdom. 
                Any disputes shall be subject to the exclusive jurisdiction of UK courts.
              </p>

              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Information</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our 
                <Link href="/contact" className="text-purple-400 hover:text-purple-300 font-medium"> contact page</Link>.
              </p>

            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-12 text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <Link 
                href="/privacy" 
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Privacy Policy
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