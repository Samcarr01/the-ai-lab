import { createClient } from './supabase/client'

export const auth = {
  async signUp(email: string, password: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    return { data, error }
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
    
    // Clear localStorage persistence flag
    localStorage.removeItem('supabase-auth-persist')
    
    const { error } = await supabase.auth.signOut()
    
    return { error }
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
    const supabase = createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    return { user, error }
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