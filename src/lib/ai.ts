// AI analysis service for GPTs and documents

interface AnalyzedContent {
  title: string
  description: string
  category: string
}

export const aiService = {
  async analyzeGPT(url: string): Promise<AnalyzedContent> {
    // Extract GPT ID from URL
    const gptId = url.match(/g-([a-f0-9-]+)/)?.[1]
    if (!gptId) {
      throw new Error('Invalid GPT URL format')
    }

    try {
      // Call our API endpoint to analyze the GPT
      const response = await fetch('/api/ai/analyze-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('GPT analysis API error:', response.status, errorText)
        throw new Error(`Failed to analyze GPT: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('GPT analysis error:', error)
      throw error
    }
  },

  async analyzeDocument(file: File): Promise<AnalyzedContent> {
    try {
      const formData = new FormData()
      formData.append('document', file)

      // Use the working endpoint that definitely works
      const response = await fetch('/api/ai/analyze-document-working', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to analyze document')
      }

      return await response.json()
    } catch (error) {
      console.error('Document analysis error:', error)
      throw error
    }
  }
}