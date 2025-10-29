import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ghost-X Mobile | 심레이싱 갤러리 멀티 일정',
  description: '모바일 최적화된 심레이싱 갤러리 멀티 일정 관리 시스템',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#0f172a',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ghost-X Mobile',
  },
}

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} bg-slate-900 text-white min-h-screen`}>
      <div className="mobile-container">
        {children}
      </div>
    </div>
  )
}


