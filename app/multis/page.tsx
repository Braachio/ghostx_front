'use client'

import MultiListPage from '@/components/MultiListPage'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface MeResponse {
  id: string
  username: string
}

export default function MultisPage() {
  const [user, setUser] = useState<MeResponse | null | undefined>(undefined)

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch('/api/me')
        if (res.ok) {
          const { user } = await res.json()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('사용자 정보 확인 실패:', err)
        setUser(null)
      }
    }

    checkLogin()
  }, [])

  if (user === undefined) {
    return <p className="p-6 text-gray-500">로딩 중...</p>
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen max-w-screen-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🗓️ 멀티 캘린더</h1>
        <Link href="/">
          <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            🏠 홈으로
          </button>
        </Link>        
        {/* <div className="space-x-2">
          <Link href="/multis/new">
            <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              📢 공지 등록
            </button>
          </Link>

          {user && (
            <Link href="/myposts">
              <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                📂 내 게시글 관리
              </button>
            </Link>
          )}
        </div> */}
      </div>
      <MultiListPage currentUserId={user?.id ?? null} />
    </div>
  )
}
