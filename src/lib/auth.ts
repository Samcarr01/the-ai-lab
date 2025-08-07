import { createClient } from './supabase/client'

// Safe origin getter for SSR/CSR compatibility
const getOrigin = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

// Expose supabase client for auth state listening
const supabase = createClient()

// Simple rate limiting to prevent 429 errors
let lastAuthCall = 0
let lastSignupCall = 0
const MIN_AUTH_INTERVAL = 1000 // 1 second minimum between auth calls
const MIN_SIGNUP_INTERVAL = 2000 // 2 seconds minimum between signup calls

export const auth = {
  supabase,
  async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    // Simple rate limiting protection for signup calls
    const now = Date.now()
    if (now - lastSignupCall < MIN_SIGNUP_INTERVAL) {
      const waitTime = MIN_SIGNUP_INTERVAL - (now - lastSignupCall)
      console.log(`🔄 Auth: Rate limiting signup - waiting ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    lastSignupCall = Date.now()
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getOrigin()}/auth/callback`,
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
          }
        },
      })
      
      return { data, error }
    } catch (err: any) {
      console.error('❌ Auth: Signup error:', err)
      
      // Check if it's a 429 rate limit error
      if (err.message?.includes('429') || err.status === 429) {
        console.error('🚨 Auth: Signup rate limit detected - backing off for 3 seconds')
        await new Promise(resolve => setTimeout(resolve, 3000))
        return { data: null, error: { message: 'Too many signup attempts. Please wait a moment and try again.' } }
      }
      
      return { data: null, error: err }
    }
  },

  async signIn(email: string, password: string, rememberMe: boolean = false) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Handle session persistence based on rememberMe
    if (data.session && rememberMe) {
      // Store user preference for longer session
      localStorage.setItem('supabase-auth-persist', 'true')
    } else {
      // Clear persistence preference for session-only auth
      localStorage.removeItem('supabase-auth-persist')
    }
    
    return { data, error }
  },

  async signOut() {
    const supabase = createClient()
    
    // Clear all auth-related localStorage items
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase-auth-persist')
      localStorage.removeItem('rememberMe')
      
      // Clear all supabase auth keys (they start with 'sb-')
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    const { error } = await supabase.auth.signOut()
    
    return { error }
  },

  // Clear all auth data in case of token issues
  async clearAuthData() {
    console.log('🧹 Clearing all auth data...')
    
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem('supabase-auth-persist')
      localStorage.removeItem('rememberMe')
      
      // Clear all supabase auth keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    // Sign out from Supabase
    const supabase = createClient()
    await supabase.auth.signOut()
    
    console.log('✅ Auth data cleared')
  },

  async resetPassword(email: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    return { data, error }
  },

  async updatePassword(password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.updateUser({
      password,
    })
    
    return { data, error }
  },

  async signInWithGoogle() {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    return { data, error }
  },

  async getUser() {
    // Simple rate limiting protection to prevent 429 errors
    const now = Date.now()
    if (now - lastAuthCall < MIN_AUTH_INTERVAL) {
      console.log('🔄 Auth: Rate limiting - throttling request...')
      await new Promise(resolve => setTimeout(resolve, MIN_AUTH_INTERVAL - (now - lastAuthCall)))
    }
    
    lastAuthCall = Date.now()
    const supabase = createClient()
    
    try {
      // Add timeout to prevent hanging requests
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth request timeout')), 8000)
      )
      
      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]) as any
      
      // If we get a refresh token error, clear the session
      if (error && (error.message?.includes('Refresh Token') || error.message?.includes('Invalid Refresh'))) {
        console.log('🔄 Auth: Invalid refresh token detected, clearing session...')
        await this.signOut()
        return { user: null, error }
      }
      
      return { user, error }
    } catch (err: any) {
      console.error('❌ Auth: Error getting user:', err)
      
      // Check if it's a timeout
      if (err.message?.includes('timeout')) {
        console.error('🚨 Auth: Request timeout - returning null user')
        return { user: null, error: { message: 'Authentication timeout' } }
      }
      
      // Check if it's a 429 rate limit error
      if (err.message?.includes('429') || err.status === 429) {
        console.error('🚨 Auth: Rate limit detected - backing off for 2 seconds')
        await new Promise(resolve => setTimeout(resolve, 2000))
        return { user: null, error: { message: 'Rate limit exceeded. Please wait a moment and try again.' } }
      }
      
      return { user: null, error: err }
    }
  },

  async getSession() {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    return { session, error }
  },

  async refreshSession() {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.refreshSession()
    
    return { data, error }
  },

}