import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { MobileTabBar, SiteHeader, type NavUser } from '@/components/site-nav'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Deutsch Lernen — Học tiếng Đức từ A1 đến C2',
    template: '%s · Deutsch Lernen',
  },
  description:
    'Ứng dụng học tiếng Đức theo khung CEFR A1.1 → C2: từ vựng có phát âm, ngữ pháp tra cứu, 7 loại bài tập và ôn tập ngắt quãng SM-2.',
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  let navUser: NavUser | null = null
  if (user) {
    const dueCount = await prisma.srsCard.count({
      where: { userId: user.id, dueDate: { lte: new Date() } },
    })
    navUser = {
      name: user.name,
      xp: user.xp,
      streakCount: user.streakCount,
      dueCount,
    }
  }

  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader user={navUser} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <MobileTabBar user={navUser} />
      </body>
    </html>
  )
}
