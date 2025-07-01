'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }
    
    try {
      const { data, error } = await auth.signUp(email, password)
      
      if (error) {
        setError(error.message)
      } else if (data.user) {
        setSuccess(true)
        // Don't redirect immediately - user needs to confirm email
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
          Create your free account! 🚀
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          No credit card required • Free account required to explore
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Free access highlight */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-green-50 border border-green-200/50 shadow-md">
            <span className="text-green-700 font-semibold text-lg">Free to start</span>
            <span className="text-green-600 ml-2">• Upgrade for £15/month</span>
          </div>
        </div>

        <div className="glass rounded-2xl px-8 py-8 shadow-xl border border-purple-100">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-600">
                🎉 Account created! Check your email to confirm your account and access your free account.
              </p>
            </div>
          )}

          {/* What's included free vs pro */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Free access includes:</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <span>👀</span>
                  <span>Preview all GPTs & playbooks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📝</span>
                  <span>Full access to all blog posts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🔍</span>
                  <span>Explore categories & descriptions</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
              <h3 className="text-sm font-semibold text-purple-900 mb-3">Upgrade to Pro for:</h3>
              <div className="space-y-2 text-sm text-purple-700">
                <div className="flex items-center space-x-2">
                  <span>🤖</span>
                  <span>Direct links to all GPTs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📚</span>
                  <span>Download all PDF playbooks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          </div>

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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agree" className="text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-purple-600 hover:text-purple-500 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-purple-600 hover:text-purple-500 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !agreed}
                className="w-full flex justify-center items-center space-x-2 gradient-purple text-white py-3 px-4 rounded-xl text-sm font-semibold button-hover shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
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
                className="w-full inline-flex justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">🔗</span>
                <span className="ml-2">Google</span>
              </button>

              <button
                type="button"
                className="w-full inline-flex justify-center py-3 px-4 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">⚡</span>
                <span className="ml-2">GitHub</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                Sign in here 👋
              </Link>
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <span>🔒</span>
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⚡</span>
            <span>Instant access</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>❌</span>
            <span>Cancel anytime</span>
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