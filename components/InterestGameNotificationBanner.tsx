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

interface RegularEvent {
  id: string
  title: string
  game: string
  day_of_week: string
  start_time: string
  event_type: string
}

export default function InterestGameNotificationBanner({ userId }: InterestGameNotificationBannerProps) {
  const [interestGames, setInterestGames] = useState<string[]>([])
  const [recentEvents, setRecentEvents] = useState<InterestEvent[]>([])
  const [todayRegularEvents, setTodayRegularEvents] = useState<RegularEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [joiningEvents, setJoiningEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // 병렬로 API 호출하여 성능 개선
        const [interestResponse, eventsResponse] = await Promise.all([
          fetch('/api/user-interest-games'),
          fetch('/api/multis')
        ])
        
        let interestGamesList: string[] = []
        
        if (interestResponse.ok) {
          const interestData = await interestResponse.json()
          interestGamesList = interestData.games || []
          setInterestGames(interestGamesList)
        }
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          // 최근 기습 갤멀 이벤트 필터링
          const recent = eventsData.filter((event: { created_at: string; game: string; event_type: string }) => {
            const eventDate = new Date(event.created_at)
            const isRecent = eventDate > oneDayAgo
            const isInterestGame = interestGamesList.includes(event.game)
            const isFlashEvent = event.event_type === 'flash_event'
            
            return isRecent && isInterestGame && isFlashEvent
          }).slice(0, 3)

          setRecentEvents(recent)

          // 오늘의 정기 멀티 이벤트 찾기
          const today = new Date().getDay()
          const dayNames = ['일', '월', '화', '수', '목', '금', '토']
          const todayName = dayNames[today]
          
          const todayRegular = eventsData.filter((event: { id: string; title: string; game: string; day_of_week?: string; multi_day?: string | string[]; start_time: string; event_type: string }) => {
            const isRegularEvent = event.event_type === 'regular_schedule'
            
            let isToday = false
            if (event.multi_day) {
              if (Array.isArray(event.multi_day)) {
                isToday = event.multi_day.includes(todayName)
              } else {
                isToday = event.multi_day === todayName
              }
            } else if (event.day_of_week) {
              isToday = event.day_of_week === todayName
            }
            
            const isInterestGame = interestGamesList.includes(event.game)
            
            return isRegularEvent && isToday && isInterestGame
          })

          setTodayRegularEvents(todayRegular)
        }
      } catch (error) {
        console.error('관심 게임 배너 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // 참가 신청 함수
  const handleJoinEvent = async (eventId: string, eventTitle: string) => {
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }

    // 이미 참가 신청 중인지 확인
    if (joiningEvents.has(eventId)) {
      return
    }

    try {
      // 참가 신청 중 상태로 설정
      setJoiningEvents(prev => new Set(prev).add(eventId))

      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        alert(`"${eventTitle}" 이벤트에 참가신청이 완료되었습니다!`)
        // 성공한 이벤트는 목록에서 제거
        setRecentEvents(prev => prev.filter(event => event.id !== eventId))
        setTodayRegularEvents(prev => prev.filter(event => event.id !== eventId))
      } else {
        const errorData = await response.json()
        if (errorData.error === '이미 참가 신청하셨습니다.') {
          alert('이미 참가신청이 완료되어 있습니다.')
          // 이미 참가한 이벤트는 목록에서 제거
          setRecentEvents(prev => prev.filter(event => event.id !== eventId))
          setTodayRegularEvents(prev => prev.filter(event => event.id !== eventId))
        } else {
          alert(`참가신청 실패: ${errorData.error}`)
        }
      }
    } catch (error) {
      console.error('참가신청 오류:', error)
      alert('참가신청 중 오류가 발생했습니다.')
    } finally {
      // 참가 신청 중 상태 해제
      setJoiningEvents(prev => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
    }
  }

  // 로그인하지 않았거나 관심 게임이 없으면 표시하지 않음
  if (!userId || interestGames.length === 0 || dismissed || loading) {
    return null
  }

  // 최근 이벤트나 오늘의 정기 멀티가 없으면 표시하지 않음
  if (recentEvents.length === 0 && todayRegularEvents.length === 0) {
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
                {recentEvents.length > 0 && todayRegularEvents.length > 0 
                  ? '관심 게임 새 이벤트!' 
                  : recentEvents.length > 0 
                    ? '관심 게임 기습 갤멀!'
                    : '관심 게임 정기 멀티!'
                }
              </h3>
              <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <p className="text-gray-300 mb-4">
              관심 게임에 새로운 이벤트가 있습니다!
            </p>
            
            <div className="space-y-2">
              {/* 기습 갤멀 이벤트 */}
              {recentEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="text-blue-400">⚡</div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{event.title}</div>
                    <div className="text-gray-400 text-sm">{event.game} • 기습 갤멀</div>
                  </div>
                  <button
                    onClick={() => handleJoinEvent(event.id, event.title)}
                    disabled={joiningEvents.has(event.id)}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    {joiningEvents.has(event.id) ? '참여 중...' : '참여하기'}
                  </button>
                </div>
              ))}
              
              {/* 오늘의 정기 멀티 이벤트 */}
              {todayRegularEvents.map(event => (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className="text-green-400">📅</div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{event.title}</div>
                    <div className="text-gray-400 text-sm">{event.game} • 정기 멀티 • {event.start_time}</div>
                  </div>
                  <button
                    onClick={() => handleJoinEvent(event.id, event.title)}
                    disabled={joiningEvents.has(event.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                  >
                    {joiningEvents.has(event.id) ? '참여 중...' : '참여하기'}
                  </button>
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
