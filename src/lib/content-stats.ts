import { gptsService } from './gpts'
import { documentsService } from './documents'
import { type UserTier } from './user'

export interface ContentStats {
  totalGPTs: number
  totalDocuments: number
  totalPlaybooks: number // alias for documents
  accessibleGPTs: number
  accessibleDocuments: number
  accessiblePlaybooks: number // alias for documents
}

export const contentStatsService = {
  async getContentStats(userTier: UserTier = 'free'): Promise<ContentStats> {
    try {
      const [allGPTs, allDocuments, gptAccess, docAccess] = await Promise.all([
        gptsService.getAllGPTs(),
        documentsService.getAllDocuments(),
        gptsService.getAllGPTsWithAccess(userTier),
        documentsService.getAllDocumentsWithAccess(userTier)
      ])

      const accessibleGPTs = gptAccess.filter(gpt => gpt.hasAccess).length
      const accessibleDocuments = docAccess.filter(doc => doc.hasAccess).length

      return {
        totalGPTs: allGPTs.length,
        totalDocuments: allDocuments.length,
        totalPlaybooks: allDocuments.length, // alias
        accessibleGPTs,
        accessibleDocuments,
        accessiblePlaybooks: accessibleDocuments // alias
      }
    } catch (error) {
      console.error('Error getting content stats:', error)
      return {
        totalGPTs: 0,
        totalDocuments: 0,
        totalPlaybooks: 0,
        accessibleGPTs: 0,
        accessibleDocuments: 0,
        accessiblePlaybooks: 0
      }
    }
  },

  // Get stats for all tiers at once (useful for admin)
  async getAllTierStats(): Promise<Record<UserTier, ContentStats>> {
    const [freeStats, proStats, ultraStats] = await Promise.all([
      this.getContentStats('free'),
      this.getContentStats('pro'),
      this.getContentStats('ultra')
    ])

    return {
      free: freeStats,
      pro: proStats,
      ultra: ultraStats
    }
  },

  // Get formatted text for different contexts
  getFormattedText(stats: ContentStats, context: 'banner' | 'upgrade' | 'description' = 'banner'): {
    gptText: string
    documentText: string
    playbookText: string
  } {
    const { totalGPTs, totalDocuments, accessibleGPTs, accessibleDocuments } = stats

    switch (context) {
      case 'banner':
        return {
          gptText: `all ${totalGPTs} GPTs`,
          documentText: `all ${totalDocuments} documents`,
          playbookText: `all ${totalDocuments} playbooks`
        }
      
      case 'upgrade':
        return {
          gptText: `${accessibleGPTs}/${totalGPTs} GPTs`,
          documentText: `${accessibleDocuments}/${totalDocuments} documents`,
          playbookText: `${accessibleDocuments}/${totalDocuments} playbooks`
        }
      
      case 'description':
        return {
          gptText: `${totalGPTs} GPTs`,
          documentText: `${totalDocuments} documents`,
          playbookText: `${totalDocuments} playbooks`
        }
      
      default:
        return {
          gptText: `${totalGPTs} GPTs`,
          documentText: `${totalDocuments} documents`,
          playbookText: `${totalDocuments} playbooks`
        }
    }
  }
}