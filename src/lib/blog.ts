import { supabase } from './supabase/client'

export interface BlogPost {
  id: string
  title: string
  content: string
  slug: string
  published_at: string
  meta_description: string
  category: string
  read_time: number
  created_at: string
  updated_at: string
}

export const blogService = {
  async getAllPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching blog posts:', error)
      return []
    }

    return data || []
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching blog post:', error)
      return null
    }

    return data
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .order('category')

    if (error) {
      console.error('Error fetching blog categories:', error)
      return []
    }

    const categories = data?.map(item => item.category) || []
    return [...new Set(categories)]
  },

  async createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([post])
      .select()
      .single()

    if (error) {
      console.error('Error creating blog post:', error)
      return null
    }

    return data
  },

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating blog post:', error)
      return null
    }

    return data
  },

  async deletePost(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting blog post:', error)
      return false
    }

    return true
  }
}