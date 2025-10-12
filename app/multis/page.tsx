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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-400 text-lg">기습 갤멀을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 - 고스트카 테마 */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-pulse">⚡</div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
            FLASH EVENTS
          </h1>
          <div className="text-2xl font-semibold text-orange-400 mb-2">기습 갤멀</div>
          <p className="text-gray-400 text-lg">
            예고 없이 갑작스럽게 열리는 일회성 레이싱 이벤트
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
        </div>

        {/* 액션 버튼 */}
        <div className="mb-8 flex justify-center gap-3">
          {user && (
            <Link href="/multis/new">
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/50 font-semibold">
                ➕ 이벤트 등록
              </button>
            </Link>
          )}
          <Link href="/events">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/50 font-semibold">
              🏁 다른 이벤트 보기
            </button>
          </Link>
          <Link href="/">
            <button className="px-6 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold">
              🏠 홈으로
            </button>
          </Link>
        </div>

        {/* 기습 갤멀 설명 카드 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-orange-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
                  기습 갤멀이란?
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  예고 없이 갑작스럽게 열리는 일회성 레이싱 이벤트입니다. 
                  정해진 일정 없이 언제든지 새로운 이벤트가 열릴 수 있으며,
                  다양한 게임과 트랙에서 즉흥적인 레이싱을 즐길 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 이벤트 목록 */}
        <EventListPage currentUserId={user?.id ?? null} eventTypeFilter={eventTypeFilter || undefined} />
      </div>
    </div>
  )
}

export default function MultisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-400 text-lg">기습 갤멀을 불러오는 중...</p>
        </div>
      </div>
    }>
      <MultisPageContent />
    </Suspense>
  )
}
