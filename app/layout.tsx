'use client'

import { useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ToastContainer } from 'react-toastify'
import { Orbitron, Exo_2 } from 'next/font/google'
import type { Database } from '@/lib/database.types'
import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import { LanguageProvider } from '@/contexts/LanguageContext'

// 레이싱 느낌의 폰트 추가
const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createPagesBrowserClient<Database>())

  return (
    <html lang="ko" className={`${orbitron.variable} ${exo2.variable}`}>
      <head>
        {/* Pretendard 폰트 - 현대적이고 가독성 좋은 한글 폰트 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-black" suppressHydrationWarning={true}>
        <LanguageProvider>
          <SessionContextProvider supabaseClient={supabase}>
            {children}
          </SessionContextProvider>
        </LanguageProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </body>
    </html>
  )
}
