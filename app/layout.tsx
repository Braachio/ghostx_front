'use client'

import { useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ToastContainer } from 'react-toastify'
import type { Database } from '@/lib/database.types'
import './globals.css'
import 'react-toastify/dist/ReactToastify.css'
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createPagesBrowserClient<Database>())

  return (
    <html lang="ko">
      <head>
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
