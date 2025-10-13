'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface InterestGameNotificationBannerProps {
  userId?: string | null
}

interface InterestEvent {
  id: string
  title: string
  game: string
  event_type: string
  created_at: string
}

export default function InterestGameNotificationBanner({ userId }: InterestGameNotificationBannerProps) {
  const [interestGames, setInterestGames] = useState<string[]>([])
  const [recentEvents, setRecentEvents] = useState<InterestEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // 관심 게임 로드
        const interestResponse = await fetch('/api/user/interest-games')
        if (interestResponse.ok) {
          const interestData = await interestResponse.json()
          setInterestGames(interestData.games || [])
        }

        // 최근 이벤트 로드 (관심 게임 관련)
        const eventsResponse = await fetch('/api/multis')
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          const recent = eventsData.filter((event: any) => {
            const eventDate = new Date(event.created_at)
            return eventDate > oneDayAgo && 
                   interestData.games?.includes(event.game) &&
                   event.event_type === 'flash_event'
          }).slice(0, 3) // 최대 3개

          setRecentEvents(recent)
        }
      } catch (error) {
        console.error('알림 배너 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // 로그인하지 않았거나 관심 게임이 없으면 표시하지 않음
  if (!userId || interestGames.length === 0 || dismissed || loading) {
    return null
  }

  // 최근 이벤트가 없으면 표시하지 않음
  if (recentEvents.length === 0) {
    return null
  }

  return (
    <div className="relative mb-8 group">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
      <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-orange-500/40 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl animate-pulse">🔔</div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                관심 게임 새 이벤트!
              </h3>
              <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">
              관심 게임에 새로운 기습 갤멀이 열렸습니다!
            </p>
            
            <div className="space-y-2">
              {recentEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="text-blue-400">⚡</div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{event.title}</div>
                    <div className="text-gray-400 text-sm">{event.game}</div>
                  </div>
                  <Link
                    href={`/multis?id=${event.id}`}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
                  >
                    참여하기
                  </Link>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex gap-3">
              <Link
                href="/multis"
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all font-semibold"
              >
                모든 기습 갤멀 보기
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
              >
                관심 게임 설정
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
