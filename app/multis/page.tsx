'use client'

import EventListPage from '@/components/EventListPage'
import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface MeResponse {
  id: string
  username: string
}

function MultisPageContent() {
  const [user, setUser] = useState<MeResponse | null | undefined>(undefined)
  const searchParams = useSearchParams()
  const eventTypeFilter = searchParams.get('type')

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
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-cyan-400 text-xl">👻 고스트카를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-700"></div>
        
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-16 gap-6 h-full">
            {Array.from({ length: 256 }).map((_, i) => (
              <div key={i} className="border border-gray-600"></div>
            ))}
          </div>
        </div>
      </div>

      {/* 💡 최상위에서만 너비와 패딩 설정 */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 relative z-10">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center mb-8 border-b border-cyan-500 pb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              🗓️ 심레이싱게임갤러리 멀티
            </h1>
            <p className="text-gray-300 mt-2">다른 고스트카들과 경쟁하고 레이싱 이벤트에 참여해보세요</p>
          </div>
          <div className="flex gap-3">
            {user && (
              <Link href="/multis/new">
                <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/25 font-semibold">
                  ➕ 이벤트 등록
                </button>
              </Link>
            )}
            {user && (
              <Link href="/dashboard">
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/25 font-semibold">
                  📈 대시보드
                </button>
              </Link>
            )}
            <Link href="/">
              <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 font-semibold">
                🏠 홈으로
              </button>
            </Link>
          </div>
        </div>

        {/* 내부 콘텐츠 */}
        <EventListPage currentUserId={user?.id ?? null} eventTypeFilter={eventTypeFilter || undefined} />
      </div>
    </div>
  )
}

export default function MultisPage() {
  return (
    <Suspense fallback={
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-cyan-400 text-xl">👻 고스트카를 불러오는 중...</p>
      </div>
    }>
      <MultisPageContent />
    </Suspense>
  )
}
