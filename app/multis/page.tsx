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
    <div className="max-w-screen-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📢 공지 모음</h1>
        <div className="space-x-2">
          <Link href="/multis/notice">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">공지 등록</button>
          </Link>
          {user && (
            <Link href="/multis/new">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">일정 등록</button>
            </Link>
          )}
          <Link href="/">
            <button className="px-4 py-2 bg-gray-500 text-white rounded">홈으로</button>
          </Link>
        </div>
      </div>
      <MultiListPage currentUserId={user?.id ?? null} />
    </div>
  )
}
