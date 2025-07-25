import Link from 'next/link'
import Image from 'next/image'
import DarkThemeBackground from '@/components/DarkThemeBackground'

export default function AuthCodeErrorPage() {
  return (
    <DarkThemeBackground className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 gradient-purple rounded-xl flex items-center justify-center shadow-lg p-3">
              <Image
                src="/logo.png"
                alt="thehackai logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-gradient">thehackai</span>
          </Link>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          Email Confirmation Issue 📧
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          There was a problem confirming your email address
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl px-8 py-8 shadow-xl border border-purple-500/30 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-4">
            Email confirmation failed
          </h3>
          
          <p className="text-sm text-gray-300 mb-6">
            Don't worry! This usually happens when:
          </p>
          
          <ul className="text-sm text-gray-300 text-left mb-6 space-y-2 bg-slate-700/50 rounded-xl p-4">
            <li>• The confirmation link expired (they last 24 hours)</li>
            <li>• The link was already used to confirm your account</li>
            <li>• There was a temporary service issue</li>
          </ul>
          
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full block gradient-purple text-white py-3 px-4 rounded-xl text-sm font-semibold button-hover shadow-lg text-center"
            >
              Try signing in 🔑
            </Link>
            
            <Link
              href="/signup"
              className="w-full block bg-slate-700 text-purple-300 py-3 px-4 rounded-xl text-sm font-semibold border border-purple-500/30 hover:bg-slate-600 hover:border-purple-400 transition-all duration-300 text-center"
            >
              Create new account ✨
            </Link>
          </div>
          
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-blue-200">
              💡 <strong>Already confirmed?</strong> Try signing in directly - your account might already be active!
            </p>
          </div>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-300 hover:text-purple-400 transition-colors flex items-center justify-center space-x-1">
          <span>←</span>
          <span>Back to thehackai</span>
        </Link>
      </div>
    </DarkThemeBackground>
  )
}