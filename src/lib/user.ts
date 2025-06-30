import { createClient } from './supabase/client'

export interface UserProfile {
  id: string
  email: string
  is_pro: boolean
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export const userService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    // Give admin free Pro access
    if (data && data.email === 'samcarr1232@gmail.com') {
      return {
        ...data,
        is_pro: true  // Admin always has Pro access
      }
    }
    
    return data
  },

  async createProfile(userId: string, email: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          is_pro: false
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }
    
    return data
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }
    
    return data
  },

  async upgradeToPro(userId: string, stripeCustomerId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .update({
        is_pro: true,
        stripe_customer_id: stripeCustomerId
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Error upgrading user to pro:', error)
      return false
    }
    
    return true
  }
}