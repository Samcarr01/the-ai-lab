import { createClient } from './supabase/client'

export type UserTier = 'free' | 'pro' | 'ultra'

// Enhanced caching and rate limiting to prevent excessive database calls
let lastDbCall = 0
const MIN_DB_INTERVAL = 1000 // 1 second minimum between database calls
let dbCallQueue = new Map<string, Promise<any>>()

// In-memory cache for user profiles
interface ProfileCache {
  profile: UserProfile
  timestamp: number
  ttl: number
}

const profileCache = new Map<string, ProfileCache>()
const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Optimized profile cache with fast fallback to localStorage
// Prioritizes cached data to ensure the app remains responsive

export interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
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

// Helper function to get user display name
export const getUserDisplayName = (user: UserProfile | null): string => {
  if (!user) return 'User'
  
  // If we have first and last name, use them
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`.trim()
  }
  
  // If we only have first name, use it
  if (user.first_name) {
    return user.first_name
  }
  
  // Fall back to extracting name from email
  const email = user.email
  const username = email.split('@')[0]
  
  // Remove common number patterns from the end
  const withoutNumbers = username.replace(/\d+$/, '')
  
  // Try to split on common patterns
  let parts: string[] = []
  
  // Check for common separators first
  if (withoutNumbers.includes('.')) {
    parts = withoutNumbers.split('.')
  } else if (withoutNumbers.includes('_')) {
    parts = withoutNumbers.split('_')
  } else if (withoutNumbers.includes('-')) {
    parts = withoutNumbers.split('-')
  } else {
    // Try to intelligently split camelCase or common name patterns
    const commonFirstNames = ['sam', 'john', 'jane', 'mike', 'chris', 'alex', 'david', 'sarah', 'emma', 'james']
    
    for (const firstName of commonFirstNames) {
      if (withoutNumbers.toLowerCase().startsWith(firstName)) {
        const remaining = withoutNumbers.slice(firstName.length)
        if (remaining.length > 0) {
          parts = [firstName, remaining]
          break
        }
      }
    }
    
    // If no pattern found, just use the whole username
    if (parts.length === 0) {
      parts = [withoutNumbers]
    }
  }
  
  // Capitalize each part
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  )
  
  // Return the formatted name or fall back to username
  return capitalizedParts.length > 1 ? capitalizedParts.join(' ') : capitalizedParts[0] || username
}

export const userService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const now = Date.now()
    
    // Check cache first
    const cached = profileCache.get(userId)
    if (cached && now - cached.timestamp < cached.ttl) {
      console.log('🚀 User: Using cached profile for userId:', userId)
      return cached.profile
    }
    
    // Rate limiting protection and deduplication
    const cacheKey = `getProfile_${userId}`
    
    // If there's already a pending call for this user, wait for it
    if (dbCallQueue.has(cacheKey)) {
      console.log('🔄 User: Waiting for existing profile fetch for userId:', userId)
      return await dbCallQueue.get(cacheKey)!
    }
    
    // Rate limiting protection
    if (now - lastDbCall < MIN_DB_INTERVAL) {
      console.log('🔄 User: Rate limiting - waiting 500ms before database call')
      await new Promise(resolve => setTimeout(resolve, MIN_DB_INTERVAL))
    }
    
    lastDbCall = Date.now()
    
    console.log('🔍 Fetching profile for userId:', userId)
    
    // Create promise for queue management with timeout
    const profilePromise = (async () => {
      try {
        // Use optimized direct client with fast timeout and retry
        const supabase = createClient()
        
        const fastQuery = async (): Promise<UserProfile | null> => {
          try {
            console.log('🚀 User: Attempting fast direct query with RLS optimization')
            
            // Use the most optimized query possible with RLS
            const { data, error } = await supabase
              .from('users')
              .select('id, email, first_name, last_name, is_pro, user_tier, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end, created_at, updated_at')
              .eq('id', userId)
              .limit(1)
              .single()
            
            if (error) {
              console.error('❌ Direct query error:', error.message)
              return null
            }
            
            if (!data) {
              console.log('📝 No profile found with direct query')
              return null
            }
            
            console.log('✅ Direct query successful')
            
            // Apply admin logic and type conversion
            let profile: UserProfile
            if (data.email === 'samcarr1232@gmail.com' && !data.user_tier) {
              profile = {
                ...data,
                is_pro: true,
                user_tier: 'ultra' as UserTier
              }
            } else {
              profile = {
                ...data,
                is_pro: data.user_tier === 'pro' || data.user_tier === 'ultra'
              }
            }
            
            return profile
          } catch (queryError: any) {
            console.error('❌ Direct query exception:', queryError)
            return null
          }
        }
        
        // Try fast query with short timeout
        const timeoutPromise = new Promise<UserProfile | null>((resolve) => {
          setTimeout(() => {
            console.log('⏰ Fast query timeout - will try cached fallback')
            resolve(null)
          }, 1500) // Very short timeout - if RLS is optimized this should be fast
        })
        
        const profileData = await Promise.race([fastQuery(), timeoutPromise])
        
        console.log('📊 Query result:', { 
          hasData: !!profileData, 
          data: profileData 
        })
        
        if (!profileData) {
          console.log('⏰ User: Query timeout - checking cached data...')
          try {
            const cachedData = localStorage.getItem('cached-user-profile')
            if (cachedData) {
              const cachedProfile = JSON.parse(cachedData)
              if (cachedProfile.id === userId) {
                console.log('✅ User: Using cached profile data for fallback')
                return cachedProfile
              }
            }
          } catch (e) {
            console.log('⚠️ User: Could not access cached data')
          }
          return null
        }
        
        console.log('✅ User profile fetched successfully')
        
        // Cache the profile
        profileCache.set(userId, {
          profile: profileData,
          timestamp: now,
          ttl: DEFAULT_CACHE_TTL
        })
        
        // Store in localStorage as backup
        try {
          localStorage.setItem('cached-user-profile', JSON.stringify(profileData))
        } catch (e) {
          console.log('⚠️ User: Could not cache profile data')
        }
        
        return profileData
      } catch (error: any) {
        console.error('❌ User: Error in getProfile:', error)
        
        // Try cached data on any error
        try {
          const cachedData = localStorage.getItem('cached-user-profile')
          if (cachedData) {
            const cachedProfile = JSON.parse(cachedData)
            if (cachedProfile.id === userId) {
              console.log('✅ User: Using cached profile data for error fallback')
              return cachedProfile
            }
          }
        } catch (e) {
          console.log('⚠️ User: Could not access cached data on error')
        }
        
        return null
      } finally {
        // Clean up the queue
        dbCallQueue.delete(cacheKey)
      }
    })()
    
    // Store in queue
    dbCallQueue.set(cacheKey, profilePromise)
    
    return await profilePromise
  },

  async createProfile(userId: string, email: string, firstName?: string, lastName?: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    console.log('🔄 Creating profile for:', { userId, email, firstName, lastName })
    
    // First check if profile already exists to prevent duplicates (with timeout)
    try {
      const existingQuery = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1)
      
      const existingTimeout = new Promise<{ data: null }>((resolve) => {
        setTimeout(() => resolve({ data: null }), 3000)
      })
      
      const { data: existingData } = await Promise.race([existingQuery, existingTimeout])
      
      if (existingData && existingData.length > 0) {
        console.log('✅ Profile already exists, returning existing profile')
        return existingData[0]
      }
    } catch (checkError) {
      console.log('⚠️ Could not check for existing profile, proceeding with creation')
    }
    
    // Always try the simple approach first (without name columns)
    try {
      console.log('🔧 Attempting basic profile creation...')
      
      const insertQuery = supabase
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
      
      const insertTimeout = new Promise<{ data: null; error: { message: string; isTimeout: boolean } }>((resolve) => {
        setTimeout(() => {
          console.error('⏰ User: Profile creation timeout after 5 seconds')
          resolve({ data: null, error: { message: 'Profile creation timeout', isTimeout: true } })
        }, 5000)
      })
      
      const { data, error } = await Promise.race([insertQuery, insertTimeout])
      
      if (error) {
        console.error('❌ Error creating basic profile:', error)
        
        // Handle timeout errors
        if (error.message?.includes('timeout') || ('isTimeout' in error && error.isTimeout)) {
          console.log('⏰ User: Profile creation timed out - checking if profile exists')
          try {
            const { data: timeoutCheckData } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .limit(1)
            
            if (timeoutCheckData && timeoutCheckData.length > 0) {
              console.log('✅ Profile was actually created, returning it')
              return timeoutCheckData[0]
            }
          } catch (timeoutCheckError) {
            console.log('⚠️ Could not verify profile creation after timeout')
          }
          return null
        }
        
        // Handle duplicate key error (profile already exists)
        if (error.message?.includes('duplicate') || ('code' in error && error.code === '23505')) {
          console.log('🔄 Profile already exists due to duplicate, fetching existing profile...')
          try {
            const { data: existingData } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .limit(1)
            
            if (existingData && existingData.length > 0) {
              return existingData[0]
            }
          } catch (fetchError) {
            console.log('⚠️ Could not fetch existing profile after duplicate error')
          }
        }
        
        return null
      }
      
      // Handle the response data
      const profileData = data && data.length > 0 ? data[0] : null
      if (!profileData) {
        console.error('❌ No profile data returned from insert')
        return null
      }
      
      console.log('✅ Basic profile created successfully:', profileData)
      
      // If successful and we have names, try to update with names (if columns exist)
      if ((firstName || lastName) && profileData) {
        try {
          console.log('🔧 Attempting to add names to profile...')
          const { data: updatedData, error: updateError } = await supabase
            .from('users')
            .update({
              first_name: firstName || '',
              last_name: lastName || ''
            })
            .eq('id', userId)
            .select()
            .single()
          
          if (updateError) {
            console.log('⚠️ Could not add names (columns may not exist):', updateError.message)
            // Return the basic profile - names will be handled later
            return profileData
          } else {
            console.log('✅ Profile updated with names successfully')
            return updatedData
          }
        } catch (updateErr) {
          console.log('⚠️ Name update failed, returning basic profile:', updateErr)
          return profileData
        }
      }
      
      return profileData
    } catch (err) {
      console.error('❌ Fatal error in createProfile:', err)
      return null
    }
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