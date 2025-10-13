'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import { getDateFromWeekAndDay } from '@/app/utils/weekUtils'
import { MultiWithTemplate } from '@/types/events'

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

interface RegularEventPageProps {
  params: Promise<{ game: string }>
}

export default function RegularEventPage({ params }: RegularEventPageProps) {
  const [game, setGame] = useState<string>('')
  const [events, setEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming')

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setGame(resolvedParams.game)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!game) return

    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data: MultiWithTemplate[] = await response.json()
          
          // 해당 게임의 정기 갤멀만 필터링
          const gameName = gameNames[game]
          const regularEvents = data.filter(event => 
            event.game === gameName && 
            event.event_type === 'regular_schedule'
          )
          
          setEvents(regularEvents)
        }
      } catch (error) {
        console.error('정기 갤멀 조회 실패:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [game])

  // 이벤트가 과거인지 미래인지 판단하는 함수
  const isEventPast = (multi: MultiWithTemplate) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // event_date가 있으면 해당 날짜 사용
    if (multi.event_date) {
      const eventDate = new Date(multi.event_date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate < today
    }
    
    // event_date가 없으면 주차 계산 사용
    if (multi.year && multi.week && multi.multi_day && multi.multi_day.length > 0) {
      const eventDate = getDateFromWeekAndDay(multi.year, multi.week, multi.multi_day[0])
      if (eventDate) {
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
        return eventDay < today
      }
    }
    
    return false
  }

  // 필터링
  const filteredEvents = events.filter(event => {
    if (timeFilter === 'all') return true
    
    const isPast = isEventPast(event)
    
    switch (timeFilter) {
      case 'upcoming':
        return !isPast
      case 'past':
        return isPast
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-400 text-lg">정기 갤멀을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gameName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 - 고스트카 테마 */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-pulse">🏁</div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            {gameName.toUpperCase()}
          </h1>
          <div className="text-2xl font-semibold text-cyan-400 mb-2">REGULAR SCHEDULE</div>
          <p className="text-gray-400 text-lg">
            {filteredEvents.length}개의 정기 이벤트 • 매주 정해진 시간
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex justify-center gap-4 mb-8">
          <Link href={`/events/regular/${game}/new`}>
            <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/50 font-semibold">
              ➕ 정기 이벤트 추가
            </button>
          </Link>
          <Link href="/events">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/50 font-semibold">
              🗓️ 다른 이벤트 보기
            </button>
          </Link>
        </div>

        {/* 필터 */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex gap-2 p-1.5 bg-gray-900/90 border border-blue-500/30 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setTimeFilter('upcoming')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                timeFilter === 'upcoming'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 예정된 이벤트
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                timeFilter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 전체
            </button>
            <button
              onClick={() => setTimeFilter('past')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                timeFilter === 'past'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📜 지난 이벤트
            </button>
          </div>
        </div>

        {/* 정기 갤멀 설명 카드 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  정기 갤멀이란?
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  매주 정해진 시간에 열리는 정규 레이싱 이벤트입니다. 
                  일정이 고정되어 있어 언제든 참여할 수 있으며, 
                  지속적인 레이싱 경험을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 이벤트 목록 */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} multi={event} currentUserId={null} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block mb-6">
              <div className="text-8xl opacity-50">🏁</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-3">
              {gameName} 정기 갤멀이 없습니다
            </h3>
            <p className="text-gray-500 text-lg">
              {timeFilter === 'upcoming' ? '예정된 정기 갤멀이 없습니다' :
               timeFilter === 'past' ? '지난 정기 갤멀이 없습니다' :
               '등록된 정기 갤멀이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
