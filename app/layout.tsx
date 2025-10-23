'use client'

import { useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Database } from '@/lib/database.types'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createPagesBrowserClient<Database>())

  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-black" suppressHydrationWarning={true}>
        <SessionContextProvider supabaseClient={supabase}>
          {children}
        </SessionContextProvider>
      </body>
    </html>
  )
}
