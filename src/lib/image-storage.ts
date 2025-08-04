// Image storage service for permanent blog image hosting
import { createClient } from './supabase/server'

export const imageStorageService = {
  // Download and store DALL-E image to Supabase Storage (optimized)
  async storeDalleImage(dalleUrl: string, fileName: string): Promise<string | null> {
    try {
      const startTime = Date.now()
      console.log('📥 Downloading DALL-E image:', fileName)
      
      // Download the image from DALL-E URL with timeout
      const imageResponse = await Promise.race([
        fetch(dalleUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Download timeout')), 15000)
        )
      ]) as Response
      
      if (!imageResponse.ok) {
        console.error('Failed to download DALL-E image:', imageResponse.status)
        return null
      }

      const downloadTime = Date.now() - startTime
      console.log(`⚡ Image downloaded in ${downloadTime}ms`)

      const imageBuffer = await imageResponse.arrayBuffer()
      const imageFile = new File([imageBuffer], fileName, { type: 'image/png' })
      
      // Upload to Supabase Storage with optimized settings
      const supabase = createClient()
      const uploadStartTime = Date.now()
      
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(`images/${fileName}`, imageFile, {
          cacheControl: '31536000', // Cache for 1 year
          upsert: true,
          duplex: 'half' // Optimize for faster uploads
        })

      if (error) {
        console.error('Failed to upload image to Supabase:', error)
        return null
      }

      const uploadTime = Date.now() - uploadStartTime
      console.log(`⚡ Image uploaded in ${uploadTime}ms`)

      // Get public URL (cached operation)
      const { data: publicUrlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`images/${fileName}`)

      const totalTime = Date.now() - startTime
      console.log(`✅ Image stored successfully in ${totalTime}ms:`, publicUrlData.publicUrl)
      return publicUrlData.publicUrl

    } catch (error) {
      console.error('Error storing DALL-E image:', error)
      return null
    }
  },

  // Generate a unique filename for blog images
  generateImageFileName(blogTitle: string, index: number): string {
    const cleanTitle = blogTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    const timestamp = Date.now()
    return `${cleanTitle}-${index}-${timestamp}.png`
  },

  // Store multiple images and return permanent URLs
  async storeMultipleImages(images: Array<{url: string, prompt: string, description: string, placement: string}>, blogTitle: string): Promise<Array<{url: string, prompt: string, description: string, placement: string}>> {
    const storedImages = []
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const fileName = this.generateImageFileName(blogTitle, i + 1)
      const permanentUrl = await this.storeDalleImage(image.url, fileName)
      
      if (permanentUrl) {
        storedImages.push({
          ...image,
          url: permanentUrl, // Replace temporary URL with permanent one
          original_dalle_url: image.url // Keep original for reference
        })
      } else {
        // If storage fails, keep original URL (will expire but better than nothing)
        console.warn(`Failed to store image ${i + 1}, keeping original URL`)
        storedImages.push(image)
      }
    }
    
    return storedImages
  }
}