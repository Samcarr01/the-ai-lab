import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/mobile-optimizations.css'
import { AdminProvider } from '@/contexts/AdminContext'
import UniversalLayout from '@/components/UniversalLayout'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'thehackai - Battle-tested AI workflows that actually work',
  description: 'Access curated AI tools and guides for £15/month. Proven GPTs, PDF guides, and monthly additions.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-sans`}>
        <AdminProvider>
          <UniversalLayout>
            {children}
          </UniversalLayout>
        </AdminProvider>
      </body>
    </html>
  )
}