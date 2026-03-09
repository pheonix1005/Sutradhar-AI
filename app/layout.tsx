import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AIStatusProvider } from '@/hooks/use-ai-status'
import { PipelineProvider } from '@/lib/pipeline-context'
import { MobileWarning } from '@/components/mobile-warning'
import './globals.css'

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sutradhar.AI - Visual AI Agent Builder',
  description: 'Build powerful AI agents with a visual, no-code dashboard. Designed for North East India\'s SMEs.',
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${inter.variable} font-sans antialiased`}>
        <MobileWarning />
        <AIStatusProvider>
          <PipelineProvider>
            {children}
          </PipelineProvider>
        </AIStatusProvider>
        <Analytics />
      </body>
    </html>
  )
}
