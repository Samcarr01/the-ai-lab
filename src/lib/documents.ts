import { createClient } from './supabase/client'
import { userService, type UserTier } from './user'

export interface Document {
  id: string
  title: string
  description: string
  pdf_url: string
  category: string
  is_featured: boolean
  required_tier: UserTier
  added_date: string
  created_at: string
  updated_at: string
}

export interface CreateDocumentData {
  title: string
  description: string
  file: File
  category: string
  is_featured?: boolean
  required_tier?: UserTier
}

export interface DocumentWithAccess extends Document {
  hasAccess: boolean
  canUpgrade: boolean
  upgradeMessage?: string
}

export const documentsService = {
  async getAllDocuments(): Promise<Document[]> {
    const supabase = createClient()
    
    // Add timestamp to force fresh data and avoid caching
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching documents:', error)
      return []
    }
    
    return data || []
  },

  async getAllDocumentsWithAccess(userTier: UserTier): Promise<DocumentWithAccess[]> {
    const documents = await this.getAllDocuments()
    
    return documents.map(doc => ({
      ...doc,
      hasAccess: userService.hasAccessToTier(userTier, doc.required_tier || 'free'),
      canUpgrade: userTier === 'free' && (doc.required_tier === 'pro' || doc.required_tier === 'ultra'),
      upgradeMessage: this.getUpgradeMessage(userTier, doc.required_tier || 'free')
    }))
  },

  getUpgradeMessage(userTier: UserTier, requiredTier: UserTier): string | undefined {
    if (userService.hasAccessToTier(userTier, requiredTier)) {
      return undefined
    }
    
    if (userTier === 'free' && requiredTier === 'pro') {
      return 'Upgrade to Pro (£7/month) to download this playbook'
    }
    if (userTier === 'free' && requiredTier === 'ultra') {
      return 'Upgrade to Ultra (£19/month) to download this playbook'
    }
    if (userTier === 'pro' && requiredTier === 'ultra') {
      return 'Upgrade to Ultra (£19/month) to download this playbook'
    }
    
    return 'Upgrade required to download this playbook'
  },

  async getFeaturedDocumentsWithAccess(userTier: UserTier): Promise<DocumentWithAccess[]> {
    const documents = await this.getFeaturedDocuments()
    
    return documents.map(doc => ({
      ...doc,
      hasAccess: userService.hasAccessToTier(userTier, doc.required_tier || 'free'),
      canUpgrade: userTier === 'free' && (doc.required_tier === 'pro' || doc.required_tier === 'ultra'),
      upgradeMessage: this.getUpgradeMessage(userTier, doc.required_tier || 'free')
    }))
  },

  async getDocumentsByCategoryWithAccess(category: string, userTier: UserTier): Promise<DocumentWithAccess[]> {
    const documents = await this.getDocumentsByCategory(category)
    
    return documents.map(doc => ({
      ...doc,
      hasAccess: userService.hasAccessToTier(userTier, doc.required_tier || 'free'),
      canUpgrade: userTier === 'free' && (doc.required_tier === 'pro' || doc.required_tier === 'ultra'),
      upgradeMessage: this.getUpgradeMessage(userTier, doc.required_tier || 'free')
    }))
  },

  async getAccessibleDocuments(userTier: UserTier): Promise<Document[]> {
    const documents = await this.getAllDocuments()
    
    return documents.filter(doc => 
      userService.hasAccessToTier(userTier, doc.required_tier || 'free')
    )
  },

  async getDocumentsByTier(tier: UserTier): Promise<Document[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('required_tier', tier)
      .order('is_featured', { ascending: false })
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching documents by tier:', error)
      return []
    }
    
    return data || []
  },

  async getFeaturedDocuments(): Promise<Document[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('is_featured', true)
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching featured documents:', error)
      return []
    }
    
    return data || []
  },

  async getDocumentsByCategory(category: string): Promise<Document[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('category', category)
      .order('is_featured', { ascending: false })
      .order('added_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching documents by category:', error)
      return []
    }
    
    return data || []
  },

  async getCategories(): Promise<string[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('category')
      .order('category')
    
    if (error) {
      console.error('Error fetching document categories:', error)
      return []
    }
    
    // Get unique categories
    const categorySet = new Set(data?.map(item => item.category) || [])
    const categories = Array.from(categorySet)
    return categories
  },

  async downloadDocument(documentId: string, userTier: UserTier): Promise<string | null> {
    const supabase = createClient()
    
    // Get document details
    const { data: document, error } = await supabase
      .from('documents')
      .select('pdf_url, title, required_tier')
      .eq('id', documentId)
      .single()
    
    if (error || !document) {
      console.error('Error fetching document:', error)
      return null
    }
    
    // Check if user has access to this tier
    const requiredTier = document.required_tier || 'free'
    if (!userService.hasAccessToTier(userTier, requiredTier)) {
      throw new Error(`Access denied. This document requires ${requiredTier} tier access.`)
    }
    
    // Return the PDF URL for download
    return document.pdf_url
  },

  async createDocument(documentData: CreateDocumentData): Promise<Document | null> {
    const supabase = createClient()
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${documentData.file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, documentData.file)
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw uploadError
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)
    
    // Insert document record
    const { data, error } = await supabase
      .from('documents')
      .insert([{
        title: documentData.title,
        description: documentData.description,
        pdf_url: publicUrl,
        category: documentData.category,
        is_featured: documentData.is_featured ?? false,
        required_tier: documentData.required_tier ?? 'free',
        added_date: new Date().toISOString().split('T')[0]
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating document:', error)
      throw error
    }
    
    return data
  },

  async deleteDocument(documentId: string): Promise<boolean> {
    const supabase = createClient()
    
    console.log('🗑️ Starting deletion for document ID:', documentId)
    
    // First get the document to find the file URL
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('pdf_url, title')
      .eq('id', documentId)
      .single()
    
    if (fetchError) {
      console.error('❌ Error fetching document for deletion:', fetchError)
      throw fetchError
    }
    
    console.log('📄 Found document to delete:', document?.title)
    
    // Extract filename from URL and delete from storage
    if (document?.pdf_url) {
      const fileName = document.pdf_url.split('/').pop()
      if (fileName) {
        console.log('🗃️ Deleting file from storage:', fileName)
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([fileName])
        
        if (storageError) {
          console.error('⚠️ Error deleting file from storage:', storageError)
          // Continue with database deletion even if file deletion fails
        } else {
          console.log('✅ File deleted from storage successfully')
        }
      }
    }
    
    // Delete document record from database
    console.log('🗄️ Deleting document record from database...')
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
    
    if (error) {
      console.error('❌ Error deleting document from database:', error)
      throw error
    }
    
    console.log('✅ Document deleted successfully from database')
    
    // Verify deletion by checking if document still exists
    const { data: checkData } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single()
    
    if (checkData) {
      console.error('❌ Document still exists after deletion!')
      throw new Error('Document deletion failed - record still exists')
    }
    
    console.log('✅ Verified: Document completely removed')
    return true
  },

  async toggleFeature(documentId: string, isFeatured: boolean): Promise<any> {
    try {
      const response = await fetch('/api/admin/toggle-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'document',
          id: documentId,
          is_featured: isFeatured
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle feature status')
      }
      
      const result = await response.json()
      console.log('Document feature toggle result:', result)
      
      return result
    } catch (error) {
      console.error('Error toggling document feature status:', error)
      throw error
    }
  },

}