import Link from 'next/link'
import Image from 'next/image'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-lg animate-pulse-purple p-2">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                thehackai
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
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100/50">
            <div className="prose prose-lg max-w-none">
              
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                By accessing and using thehackai service, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                thehackai provides access to curated AI tools, GPTs, and PDF playbooks for a monthly subscription fee of £15. 
                Free accounts have preview access to browse content titles and descriptions.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                You must create an account to access our services. You are responsible for maintaining the confidentiality of your 
                account credentials and for all activities that occur under your account.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription and Payment</h2>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li>Pro subscriptions are billed monthly at £15</li>
                <li>Payment is processed through Stripe</li>
                <li>Subscriptions auto-renew unless cancelled</li>
                <li>No refunds for partial months</li>
                <li>You may cancel your subscription at any time</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content Usage</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                The GPTs and playbooks provided are for your personal and business use. You may not redistribute, resell, 
                or share account access with others. Content is provided "as is" without warranty.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Uses</h2>
              <ul className="mb-6 text-gray-700 leading-relaxed list-disc list-inside space-y-2">
                <li>Sharing account credentials with others</li>
                <li>Attempting to circumvent payment systems</li>
                <li>Using content for illegal or harmful purposes</li>
                <li>Reverse engineering or copying our service</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                All content, including GPTs, playbooks, and service materials, remain the property of thehackai. 
                You receive a limited license to use the content for your personal and business purposes.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                thehackai shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of the service. Our liability is limited to the amount you paid for the service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe 
                violates these Terms of Service or is harmful to other users or the service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of significant changes 
                via email or through the service. Continued use after changes constitutes acceptance.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the United Kingdom. 
                Any disputes shall be subject to the exclusive jurisdiction of UK courts.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
              <p className="mb-6 text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us through our 
                <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium"> contact page</Link>.
              </p>

            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-12 text-center">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <Link 
                href="/privacy" 
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/contact" 
                className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
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
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-semibold text-gray-900">thehackai</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <Link href="/terms" className="text-purple-600 font-medium">Terms</Link>
              <Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-purple-600 transition-colors">Contact</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2024 thehackai. Made with 💜 for AI enthusiasts.
          </div>
        </div>
      </footer>
    </div>
  )
}