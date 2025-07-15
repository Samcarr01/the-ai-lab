import { Metadata } from 'next'
import BlogPageClient from './BlogPageClient'

export const metadata: Metadata = {
  title: 'AI Insights & Tutorials | thehackai - Free AI Content & Strategies',
  description: 'Discover the latest AI strategies, tutorials, and insights to supercharge your productivity. Free access to all articles, step-by-step guides, and real-world case studies.',
  keywords: 'AI tutorials, artificial intelligence, productivity, AI tools, machine learning, automation, AI strategies, ChatGPT, AI workflows',
  authors: [{ name: 'thehackai' }],
  openGraph: {
    title: 'AI Insights & Tutorials | thehackai',
    description: 'Free AI content, tutorials, and strategies to boost your productivity. Step-by-step guides and real-world case studies.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'thehackai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Insights & Tutorials | thehackai',
    description: 'Free AI content, tutorials, and strategies to boost your productivity.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function BlogPage() {
  return <BlogPageClient />
}