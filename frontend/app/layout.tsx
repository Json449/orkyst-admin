import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Orkyst - Analytics Dashboard',
  description: 'AI-powered marketing orchestration and sentiment analysis',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/orkyst-icon.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/orkyst-icon.svg',
    apple: '/orkyst-icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
