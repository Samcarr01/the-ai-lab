import { createClient } from './supabase/client'

export type UserTier = 'free' | 'pro' | 'ultra'

export interface UserProfile {
  id: string
  email: string
  is_pro: boolean // Keep for backward compatibility
  user_tier: UserTier
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: string
  subscription_current_period_end?: string
  subscription_cancel_at_period_end?: boolean
  created_at: string
  updated_at: string
}

export const TIER_NAMES = {
  free: 'Free',
  pro: 'Pro',
  ultra: 'Ultra'
} as const

export const TIER_PRICES = {
  free: 0,
  pro: 7,
  ultra: 19
} as const

export const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Get started with AI',
    features: [
      'Blog access',
      'GPT previews',
      'Playbook previews',
      'Community access'
    ]
  },
  pro: {
    name: 'Pro',
    price: 7,
    description: 'Daily AI Use',
    features: [
      'Everything in Free',
      '3 essential GPTs',
      '2 core playbooks',
      'Email support'
    ]
  },
  ultra: {
    name: 'Ultra',
    price: 19,
    description: 'Upscale Your AI Game',
    features: [
      'Everything in Pro',
      'All 7 GPTs',
      'All 4 playbooks',
      'Priority support',
      'Early access'
    ]
  }
} as const

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
    
    // Give admin Ultra access (highest tier) only if user_tier is not already set in database
    if (data && data.email === 'samcarr1232@gmail.com' && (!data.user_tier || data.user_tier === 'free')) {
      return {
        ...data,
        is_pro: true,  // Backward compatibility
        user_tier: 'ultra' as UserTier
      }
    }
    
    // Ensure backward compatibility: sync is_pro with user_tier
    return {
      ...data,
      is_pro: data.user_tier === 'pro' || data.user_tier === 'ultra'
    }
  },

  async createProfile(userId: string, email: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          is_pro: false,
          user_tier: 'free' as UserTier
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

  async updateTier(userId: string, tier: UserTier, subscriptionData?: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    subscriptionStatus?: string
    currentPeriodEnd?: string | undefined
    cancelAtPeriodEnd?: boolean
  }): Promise<boolean> {
    const supabase = createClient()
    
    const updates = {
      user_tier: tier,
      is_pro: tier === 'pro' || tier === 'ultra', // Backward compatibility
      ...subscriptionData
    }
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user tier:', error)
      return false
    }
    
    return true
  },

  // Backward compatibility method
  async upgradeToPro(userId: string, stripeCustomerId: string): Promise<boolean> {
    return this.updateTier(userId, 'pro', {
      stripeCustomerId,
      subscriptionStatus: 'active'
    })
  },

  // Check if user has access to specific tier content
  hasAccessToTier(userTier: UserTier, requiredTier: UserTier): boolean {
    // Free content: everyone can access
    if (requiredTier === 'free') return true
    
    // Pro content: Pro and Ultra users can access
    if (requiredTier === 'pro') return userTier === 'pro' || userTier === 'ultra'
    
    // Ultra content: Only Ultra users can access
    if (requiredTier === 'ultra') return userTier === 'ultra'
    
    return false
  },

  // Get available content for user tier
  getAvailableContent(userTier: UserTier) {
    switch (userTier) {
      case 'free':
        return {
          gpts: 0,
          documents: 0,
          features: ['Blog access', 'Previews only']
        }
      case 'pro':
        return {
          gpts: 3,
          documents: 2,
          features: ['3 essential GPTs', '2 core playbooks', 'Email support']
        }
      case 'ultra':
        return {
          gpts: 7,
          documents: 4,
          features: ['All GPTs', 'All playbooks', 'Priority support', 'Early access']
        }
    }
  },

  // Get next tier upgrade info
  getUpgradeInfo(currentTier: UserTier) {
    switch (currentTier) {
      case 'free':
        return {
          nextTier: 'pro' as UserTier,
          price: TIER_PRICES.pro,
          benefits: ['Access to 3 essential GPTs', '2 core playbooks']
        }
      case 'pro':
        return {
          nextTier: 'ultra' as UserTier,
          price: TIER_PRICES.ultra,
          benefits: ['Access to all 7 GPTs', 'All 4 playbooks', 'Priority support']
        }
      case 'ultra':
        return null // Already at highest tier
    }
  }
}