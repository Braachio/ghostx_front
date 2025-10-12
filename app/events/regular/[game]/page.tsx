'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">정기 갤멀을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  const gameName = gameNames[game] || game

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🏁 {gameName} 정기 갤멀
            </h1>
            <p className="text-gray-400">
              {filteredEvents.length}개의 정기 이벤트가 있습니다
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'upcoming' | 'all' | 'past')}
              className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="upcoming">🚀 예정된 이벤트</option>
              <option value="all">📅 전체</option>
              <option value="past">📜 지난 이벤트</option>
            </select>
          </div>
        </div>

        {/* 정기 갤멀 설명 */}
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-400 mb-3">📅 정기 갤멀이란?</h2>
          <p className="text-gray-300 leading-relaxed">
            매주 정해진 시간에 열리는 정규 레이싱 이벤트입니다. 
            일정이 고정되어 있어 언제든 참여할 수 있으며, 
            지속적인 레이싱 경험을 제공합니다.
          </p>
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
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏁</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {gameName} 정기 갤멀이 없습니다
          </h3>
          <p className="text-gray-500">
            {timeFilter === 'upcoming' ? '예정된 정기 갤멀이 없습니다' :
             timeFilter === 'past' ? '지난 정기 갤멀이 없습니다' :
             '등록된 정기 갤멀이 없습니다'}
          </p>
        </div>
      )}
    </div>
  )
}
