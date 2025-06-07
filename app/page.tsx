'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface MeResponse {
  id: string
  username: string
}

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    const loadUserAndViews = async () => {
      try {
        await fetch('/api/incrementView', { method: 'POST' })

        const viewRes = await fetch('/api/getView')
        if (viewRes.ok) {
          const { view_count } = await viewRes.json()
          setViews(view_count)
        }

        const meRes = await fetch('/api/me')
        if (meRes.ok) {
          const { user } = await meRes.json()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      }
    }

    loadUserAndViews()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 text-black dark:text-white">
      {/* 조회수 표시 */}
      {views !== null && (
        <p className="ml-auto text-sm text-gray-500 dark:text-gray-400">
          총 방문수: {views.toLocaleString()}회
        </p>
      )}

      <hr className="my-4 border-t border-gray-300 dark:border-gray-700" />

      {/* 상단 사용자 정보 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm text-gray-600 dark:text-gray-300">
          {user ? `👤 ${user.username}님 환영합니다` : '🕵 로그인되지 않음'}
        </h2>

        {!user && (
          <div className="space-x-2">
            <Link
              href="/signup"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              회원가입
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              로그인
            </Link>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <h1 className="text-3xl font-bold mb-6">🏁 심레이싱 메인</h1>

      <div className="space-x-4 mb-6">
        <Link href="/multis">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            공지 모음
          </button>
        </Link>
      </div>
    </div>
  )
}
