'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import type { Database } from '@/lib/database.types'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabaseClient<Database>())

  return (
    <html lang="ko">
      <body>
        <SessionContextProvider supabaseClient={supabase}>
          {children}
        </SessionContextProvider>
      </body>
    </html>
  )
}
