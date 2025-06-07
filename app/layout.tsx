// app/layout.tsx
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Sim Racing Events',
  description: 'Time trial event platform for sim racers',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
        {children}
      </body>
    </html>
  )
}
