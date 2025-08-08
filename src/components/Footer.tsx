'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-black border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="thehackai logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                thehackai
              </span>
            </div>
            <p className="text-gray-400 text-lg mb-6 max-w-md">
              Battle-tested AI workflows that actually work. Curated tools, GPTs, and playbooks for serious professionals.
            </p>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full border border-purple-500/30">
                <span className="text-purple-300 font-semibold text-sm">🚀 Production Ready</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/toolkit" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>🛠️</span>
                  <span>Our Toolkit</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>✍️</span>
                  <span>Blog</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>💰</span>
                  <span>Pricing</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/solutions" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>🎯</span>
                  <span>Solutions</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Account</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/login" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>🔑</span>
                  <span>Sign In</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/signup" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>🚀</span>
                  <span>Get Started</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>💬</span>
                  <span>Contact</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Terms</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-2"
                >
                  <span>🔒</span>
                  <span>Privacy</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 thehackai. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-gray-400 text-sm">
                Made with ❤️ for AI professionals
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}