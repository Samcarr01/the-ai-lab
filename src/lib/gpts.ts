import { createClient } from './supabase/client'
import { userService, type UserTier } from './user'

export interface GPT {
  id: string
  title: string
  description: string
  chatgpt_url: string
  category: string
  is_featured: boolean
  required_tier: UserTier
  added_date: string
  created_at: string
  updated_at: string
}

export interface CreateGPTData {
  title: string
  description: string
  chatgpt_url: string
  category: string
  is_featured?: boolean
  required_tier?: UserTier
}

export interface GPTWithAccess extends GPT {
  hasAccess: boolean
  canUpgrade: boolean
  upgradeMessage?: string
}

export const gptsService = {
  async getAllGPTs(): Promise<GPT[]> {
    const supabase = createClient()
    
    // Force fresh data to avoid caching issues after deletions
    const { data, error } = await supabase
      .from('gpts')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching GPTs:', error)
      return []
    }
    
    return data || []
  },

  async getAllGPTsWithAccess(userTier: UserTier): Promise<GPTWithAccess[]> {
    const gpts = await this.getAllGPTs()
    
    return gpts.map(gpt => ({
      ...gpt,
      hasAccess: userService.hasAccessToTier(userTier, gpt.required_tier || 'free'),
      canUpgrade: userTier === 'free' && (gpt.required_tier === 'pro' || gpt.required_tier === 'ultra'),
      upgradeMessage: this.getUpgradeMessage(userTier, gpt.required_tier || 'free')
    }))
  },

  getUpgradeMessage(userTier: UserTier, requiredTier: UserTier): string | undefined {
    if (userService.hasAccessToTier(userTier, requiredTier)) {
      return undefined
    }
    
    if (userTier === 'free' && requiredTier === 'pro') {
      return 'Upgrade to Pro (£7/month) to access this GPT'
    }
    if (userTier === 'free' && requiredTier === 'ultra') {
      return 'Upgrade to Ultra (£19/month) to access this GPT'
    }
    if (userTier === 'pro' && requiredTier === 'ultra') {
      return 'Upgrade to Ultra (£19/month) to access this GPT'
    }
    
    return 'Upgrade required to access this GPT'
  },

  async getFeaturedGPTsWithAccess(userTier: UserTier): Promise<GPTWithAccess[]> {
    const gpts = await this.getFeaturedGPTs()
    
    return gpts.map(gpt => ({
      ...gpt,
      hasAccess: userService.hasAccessToTier(userTier, gpt.required_tier || 'free'),
      canUpgrade: userTier === 'free' && (gpt.required_tier === 'pro' || gpt.required_tier === 'ultra'),
      upgradeMessage: this.getUpgradeMessage(userTier, gpt.required_tier || 'free')
    }))
  },

  async getGPTsByCategoryWithAccess(category: string, userTier: UserTier): Promise<GPTWithAccess[]> {
    const gpts = await this.getGPTsByCategory(category)
    
    return gpts.map(gpt => ({
      ...gpt,
      hasAccess: userService.hasAccessToTier(userTier, gpt.required_tier || 'free'),
      canUpgrade: userTier === 'free' && (gpt.required_tier === 'pro' || gpt.required_tier === 'ultra'),
      upgradeMessage: this.getUpgradeMessage(userTier, gpt.required_tier || 'free')
    }))
  },

  async getAccessibleGPTs(userTier: UserTier): Promise<GPT[]> {
    const gpts = await this.getAllGPTs()
    
    return gpts.filter(gpt => 
      userService.hasAccessToTier(userTier, gpt.required_tier || 'free')
    )
  },

  async getGPTsByTier(tier: UserTier): Promise<GPT[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gpts')
      .select('*')
      .eq('required_tier', tier)
      .order('is_featured', { ascending: false })
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching GPTs by tier:', error)
      return []
    }
    
    return data || []
  },

  async getFeaturedGPTs(): Promise<GPT[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gpts')
      .select('*')
      .eq('is_featured', true)
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching featured GPTs:', error)
      return []
    }
    
    return data || []
  },

  async getGPTsByCategory(category: string): Promise<GPT[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gpts')
      .select('*')
      .eq('category', category)
      .order('is_featured', { ascending: false })
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching GPTs by category:', error)
      return []
    }
    
    return data || []
  },

  async getCategories(): Promise<string[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gpts')
      .select('category')
      .order('category')
    
    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }
    
    // Get unique categories
    const categorySet = new Set(data?.map(item => item.category) || [])
    const categories = Array.from(categorySet)
    return categories
  },

  async createGPT(gptData: CreateGPTData): Promise<GPT | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('gpts')
      .insert([{
        title: gptData.title,
        description: gptData.description,
        chatgpt_url: gptData.chatgpt_url,
        category: gptData.category,
        is_featured: gptData.is_featured ?? false,
        required_tier: gptData.required_tier ?? 'free',
        added_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating GPT:', error)
      throw error
    }
    
    return data
  },

  async deleteGPT(gptId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('gpts')
      .delete()
      .eq('id', gptId)
    
    if (error) {
      console.error('Error deleting GPT:', error)
      throw error
    }
    
    return true
  },

  async toggleFeature(gptId: string, isFeatured: boolean): Promise<any> {
    try {
      const response = await fetch('/api/admin/toggle-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'gpt',
          id: gptId,
          is_featured: isFeatured
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle feature status')
      }
      
      const result = await response.json()
      console.log('GPT feature toggle result:', result)
      
      return result
    } catch (error) {
      console.error('Error toggling GPT feature status:', error)
      throw error
    }
  },

}