import { createClient } from './supabase/client'

export interface GPT {
  id: string
  title: string
  description: string
  chatgpt_url: string
  category: string
  is_featured: boolean
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

  async toggleFeature(gptId: string, isFeatured: boolean): Promise<boolean> {
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
      
      return true
    } catch (error) {
      console.error('Error toggling GPT feature status:', error)
      throw error
    }
  },

}