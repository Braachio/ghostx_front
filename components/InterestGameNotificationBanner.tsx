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

  useEffect(() => {
    console.log('🔔 Banner: useEffect 시작, userId:', userId)
    
    if (!userId) {
      console.log('🔔 Banner: userId가 없음, 종료')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        console.log('🔔 Banner: fetchData 시작')
        
        // 관심 게임 로드
        console.log('🔔 Banner: 관심 게임 API 호출 중...')
        const interestResponse = await fetch('/api/user/interest-games')
        console.log('🔔 Banner: 관심 게임 응답 상태:', interestResponse.status)
        
        let interestGamesList: string[] = []
        
        if (interestResponse.ok) {
          const interestData = await interestResponse.json()
          console.log('🔔 Banner: 관심 게임 데이터:', interestData)
          interestGamesList = interestData.games || []
          setInterestGames(interestGamesList)
        } else {
          console.error('🔔 Banner: 관심 게임 로드 실패:', interestResponse.status)
        }

        // 최근 이벤트 로드 (관심 게임 관련)
        console.log('🔔 Banner: 이벤트 API 호출 중...')
        const eventsResponse = await fetch('/api/multis')
        console.log('🔔 Banner: 이벤트 응답 상태:', eventsResponse.status)
        
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          console.log('🔔 Banner: 전체 이벤트 수:', eventsData.length)
          
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          console.log('🔔 Banner: 24시간 전 시간:', oneDayAgo.toISOString())
          
          const recent = eventsData.filter((event: { created_at: string; game: string; event_type: string }) => {
            const eventDate = new Date(event.created_at)
            const isRecent = eventDate > oneDayAgo
            const isInterestGame = interestGamesList.includes(event.game)
            const isFlashEvent = event.event_type === 'flash_event'
            
            console.log('🔔 Banner: 이벤트 체크:', {
              title: event.title,
              game: event.game,
              event_type: event.event_type,
              created_at: event.created_at,
              isRecent,
              isInterestGame,
              isFlashEvent,
              interestGames: interestGamesList
            })
            
            return isRecent && isInterestGame && isFlashEvent
          }).slice(0, 3) // 최대 3개

          console.log('🔔 Banner: 매칭된 최근 이벤트:', recent)
          setRecentEvents(recent)

          // 오늘의 정기 멀티 이벤트 찾기
          const today = new Date().getDay() // 0=일요일, 1=월요일, ...
          const dayNames = ['일', '월', '화', '수', '목', '금', '토']
          const todayName = dayNames[today]
          
          console.log('🔔 Banner: 오늘 요일:', todayName)
          console.log('🔔 Banner: 관심 게임 목록:', interestGamesList)
          
          // 정기 멀티 이벤트만 먼저 필터링
          const regularEvents = eventsData.filter((event: any) => event.event_type === 'regular_schedule')
          console.log('🔔 Banner: 모든 정기 멀티 이벤트:', regularEvents.map(e => ({
            title: e.title,
            game: e.game,
            day_of_week: e.day_of_week,
            event_type: e.event_type,
            multi_day: e.multi_day,
            start_time: e.start_time
          })))
          
          const todayRegular = eventsData.filter((event: { id: string; title: string; game: string; day_of_week: string; start_time: string; event_type: string }) => {
            const isRegularEvent = event.event_type === 'regular_schedule'
            const isToday = event.day_of_week === todayName
            const isInterestGame = interestGamesList.includes(event.game)
            
            console.log('🔔 Banner: 정기 이벤트 체크:', {
              title: event.title,
              game: event.game,
              day_of_week: event.day_of_week,
              event_type: event.event_type,
              isRegularEvent,
              isToday,
              isInterestGame
            })
            
            return isRegularEvent && isToday && isInterestGame
          })

          console.log('🔔 Banner: 오늘의 정기 멀티 이벤트:', todayRegular)
          setTodayRegularEvents(todayRegular)
        } else {
          console.error('🔔 Banner: 이벤트 로드 실패:', eventsResponse.status)
        }
      } catch (error) {
        console.error('🔔 Banner: 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
        console.log('🔔 Banner: fetchData 완료')
      }
    }

    fetchData()
  }, [userId])

  // 렌더링 조건 체크
  console.log('🔔 Banner: 렌더링 조건 체크:', {
    userId: !!userId,
    interestGamesLength: interestGames.length,
    dismissed,
    loading,
    recentEventsLength: recentEvents.length,
    todayRegularEventsLength: todayRegularEvents.length
  })

  // 로그인하지 않았거나 관심 게임이 없으면 표시하지 않음
  if (!userId || interestGames.length === 0 || dismissed || loading) {
    console.log('🔔 Banner: 조건 미충족으로 배너 숨김')
    return null
  }

  // 최근 이벤트나 오늘의 정기 멀티가 없으면 표시하지 않음
  if (recentEvents.length === 0 && todayRegularEvents.length === 0) {
    console.log('🔔 Banner: 표시할 이벤트 없음으로 배너 숨김')
    return null
  }

  console.log('🔔 Banner: 배너 표시!')

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
                  <Link
                    href={`/multis?id=${event.id}`}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
                  >
                    참여하기
                  </Link>
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
                  <Link
                    href={`/events/regular/${encodeURIComponent(event.game)}/${event.id}`}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
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
