export interface AffiliateTool {
  id: string | number
  title: string
  description: string
  category: string
  rating?: number
  price?: string
  affiliate_url: string
  image_url?: string
  is_featured: boolean
  key_benefits?: string[]
  why_we_love_it?: string[]
  standout_features?: string[]
  created_at?: string
  updated_at?: string
}

export interface AffiliateCardProps {
  tool: AffiliateTool
  onExpand: (tool: AffiliateTool) => void
  isExpanded: boolean
  index: number
  isFeatured?: boolean
}

export interface AffiliateModalProps {
  tool: AffiliateTool | null
  isOpen: boolean
  onClose: () => void
}