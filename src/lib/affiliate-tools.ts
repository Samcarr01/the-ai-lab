// Affiliate Tools service for managing "Our Toolkit" page
import { createClient } from './supabase/client'
import { createClient as createServerClient } from './supabase/server'

export interface AffiliateTool {
  id: number
  title: string
  description: string
  affiliate_url: string
  original_url?: string
  image_url?: string
  category: string
  is_featured: boolean
  research_data?: any
  created_at: string
  updated_at: string
}

export interface AffiliateToolWithAccess extends AffiliateTool {
  hasAccess: boolean
  upgradeMessage?: string
}

export const affiliateToolsService = {
  // Get all affiliate tools for public display
  async getAll(): Promise<AffiliateTool[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('affiliate_tools')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching affiliate tools:', error)
      throw error
    }

    return data || []
  },

  // Get affiliate tools with access control (for admin)
  async getAllWithAccess(userEmail?: string): Promise<AffiliateToolWithAccess[]> {
    const tools = await this.getAll()
    
    return tools.map(tool => ({
      ...tool,
      hasAccess: true, // All users can see affiliate tools (they're public)
      upgradeMessage: undefined
    }))
  },

  // Get featured affiliate tools
  async getFeatured(): Promise<AffiliateTool[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('affiliate_tools')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching featured affiliate tools:', error)
      throw error
    }

    return data || []
  },

  // Get unique categories
  async getCategories(): Promise<string[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('affiliate_tools')
      .select('category')
      .order('category')

    if (error) {
      console.error('Error fetching affiliate tool categories:', error)
      return []
    }

    // Get unique categories and add 'All' at the beginning
    const categories = [...new Set(data?.map(item => item.category) || [])]
    return ['All', ...categories]
  },

  // Create new affiliate tool (admin only)
  async create(tool: Omit<AffiliateTool, 'id' | 'created_at' | 'updated_at'>): Promise<AffiliateTool> {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('affiliate_tools')
      .insert([tool])
      .select()
      .single()

    if (error) {
      console.error('Error creating affiliate tool:', error)
      throw error
    }

    return data
  },

  // Update affiliate tool (admin only)
  async update(id: number, updates: Partial<AffiliateTool>): Promise<AffiliateTool> {
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('affiliate_tools')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating affiliate tool:', error)
      throw error
    }

    return data
  },

  // Delete affiliate tool (admin only)
  async delete(id: number): Promise<void> {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('affiliate_tools')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting affiliate tool:', error)
      throw error
    }
  },

  // Toggle featured status
  async toggleFeatured(id: number): Promise<AffiliateTool> {
    const supabase = createServerClient()
    
    // First get current featured status
    const { data: current } = await supabase
      .from('affiliate_tools')
      .select('is_featured')
      .eq('id', id)
      .single()

    if (!current) {
      throw new Error('Affiliate tool not found')
    }

    // Toggle the featured status
    return this.update(id, { is_featured: !current.is_featured })
  }
}