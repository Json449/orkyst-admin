import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { QueryProvider } from "@/components/providers/query-provider"
import './globals.css'

export const metadata: Metadata = {
  title: 'Orkyst - Analytics Dashboard',
  description: 'AI-powered marketing orchestration and sentiment analysis',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/Orkystt.svg',
        type: 'image/svg+xml',
      },
    ],
    shortcut: '/Orkystt.svg',
    apple: '/Orkystt.svg',
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
        <QueryProvider>{children}</QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}
