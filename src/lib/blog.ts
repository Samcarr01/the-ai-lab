import { createClient } from './supabase/client'

export interface BlogPost {
  id: string
  title: string
  content: string
  slug: string
  published_at: string
  meta_description: string
  category: string
  read_time: number
  status?: 'draft' | 'published' // Optional for now
  created_at: string
  updated_at: string
}

export const blogService = {
  async getAllPosts(includesDrafts = false): Promise<BlogPost[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching blog posts:', error)
      return []
    }

    // Add default status to existing posts
    return (data || []).map(post => ({
      ...post,
      status: post.status || 'published'
    }))
  },

  async getPublishedPosts(): Promise<BlogPost[]> {
    return this.getAllPosts(false)
  },

  async getDraftPosts(): Promise<BlogPost[]> {
    // Temporarily return empty array until status column is added
    return []
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const supabase = createClient()
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
    const supabase = createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .order('category')

    if (error) {
      console.error('Error fetching blog categories:', error)
      return []
    }

    const categories = data?.map(item => item.category) || []
    return Array.from(new Set(categories))
  },

  async createPost(post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost | null> {
    const supabase = createClient()
    
    // Log the post data being saved
    console.log('Creating blog post with data:', {
      title: post.title,
      slug: post.slug,
      category: post.category,
      fieldsPresent: Object.keys(post),
      contentLength: post.content?.length || 0
    })
    
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([post]) // Don't add status field since it might not exist
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating blog post:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        console.error('Post data that failed:', post)
        throw error // Re-throw to catch in UI
      }

      console.log('Blog post created successfully:', data?.id)
      return data
    } catch (err) {
      console.error('Exception creating blog post:', err)
      throw err // Re-throw to catch in UI
    }
  },

  async updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const supabase = createClient()
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
    const supabase = createClient()
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