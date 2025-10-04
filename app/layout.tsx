import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Claude Key Portal',
  description:
    'CRS User Management Portal - Manage your Claude API keys with ease',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
