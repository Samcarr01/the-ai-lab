import Link from 'next/link'
import Image from 'next/image'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Authentication Error 😵
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Something went wrong during sign in
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass rounded-2xl px-8 py-8 shadow-xl border border-purple-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠️</span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Authentication failed
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            There was an issue processing your authentication request. This might be because:
          </p>
          
          <ul className="text-sm text-gray-600 text-left mb-6 space-y-2">
            <li>• The authentication link expired</li>
            <li>• The link was already used</li>
            <li>• There was a temporary service issue</li>
          </ul>
          
          <div className="space-y-3">
            <Link
              href="/login"
              className="w-full block gradient-purple text-white py-3 px-4 rounded-xl text-sm font-semibold button-hover shadow-lg text-center"
            >
              Try signing in again 🔄
            </Link>
            
            <Link
              href="/signup"
              className="w-full block bg-white text-purple-600 py-3 px-4 rounded-xl text-sm font-semibold border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 text-center"
            >
              Create new account ✨
            </Link>
          </div>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center space-x-1">
          <span>←</span>
          <span>Back to thehackai</span>
        </Link>
      </div>
    </div>
  )
}