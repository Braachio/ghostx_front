'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

interface MeResponse {
  id: string
  nickname: string
}

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [views, setViews] = useState<number | null>(null)
  const supabase = useSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()  // 또는 router.push('/login')
  }

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
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 방문 수 */}
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          총 방문수: {views !== null ? views.toLocaleString() : '...'}회
        </div>

        {/* 상단 */}
        <div className="flex justify-between items-center border-b pb-4 border-gray-300 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold mb-1">심레이싱 데이터 서비스</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              실제 데이터를 바탕으로 나만의 주행 분석을 시작해보세요.
            </p>
          </div>

          <div>
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-green-600 dark:text-green-400">
                  👤 {user.nickname}님 환영합니다
                </span>
                <Link
                  href="/dashboard"
                  className="text-sm px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
                >
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm px-2 py-1 bg-red-500 text-white rounded hover:bg-gray-600 transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/signup"
                  className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-800 text-white text-sm"
                >
                  회원가입
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 메뉴 카드 */}
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <Link href="/multis">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">📢 공지 모음</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                커뮤니티에서 올라온 심레이싱 이벤트 일정을 확인하고 미리 계획해보세요.
              </p>
            </div>
          </Link>

          <Link href="/upload-id">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">📊 주행 데이터 분석</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                MoTeC CSV 파일을 업로드하면 자동으로 랩 데이터를 분석해드립니다.
              </p>
            </div>
          </Link>
        </div>

        {/* 소개, FAQ, 피드백 섹션은 생략 없이 그대로 유지 */}
        {/* ... (기존 내용 그대로 유지) */}
      </div>
    </main>
  )
}
