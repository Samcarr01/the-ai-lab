'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        setError(error.message)
      } else if (data.user) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await auth.signInWithProvider(provider)
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('OAuth sign in failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 gradient-purple rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🧪</span>
            </div>
            <span className="text-2xl font-bold text-gradient">The AI Lab</span>
          </Link>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Welcome back! 👋
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access your AI workflows
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass rounded-2xl px-8 py-8 shadow-xl border border-purple-100">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center space-x-2 gradient-purple text-white py-3 px-4 rounded-xl text-sm font-semibold button-hover shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <span className="text-lg">🚀</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                className="w-full inline-flex justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">🔗</span>
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuthSignIn('github')}
                className="w-full inline-flex justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">⚡</span>
                <span className="ml-2">GitHub</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                Create free account ✨
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Back to home */}
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-purple-600 transition-colors flex items-center justify-center space-x-1">
          <span>←</span>
          <span>Back to The AI Lab</span>
        </Link>
      </div>
    </div>
  )
}