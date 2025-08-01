import { createClient } from './supabase/server'
import { BlogPost } from './blog'

export const blogServiceServer = {
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

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching blog post by slug:', error)
      return null
    }

    if (!data) {
      return null
    }

    return {
      ...data,
      status: data.status || 'published'
    }
  }
}