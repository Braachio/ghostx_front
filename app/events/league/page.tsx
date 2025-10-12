'use client'

import { useEffect, useState } from 'react'
import EventCard from '@/components/EventCard'
import { MultiWithTemplate } from '@/types/events'

export default function LeaguePage() {
  const [events, setEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data: MultiWithTemplate[] = await response.json()
          
          // 리그 이벤트만 필터링
          const leagueEvents = data.filter(event => 
            event.event_type === 'league'
          )
          
          setEvents(leagueEvents)
        }
      } catch (error) {
        console.error('리그 이벤트 조회 실패:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

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
      // 간단한 날짜 계산
      const eventDate = new Date(multi.year, 0, 1)
      const weekStart = new Date(eventDate)
      weekStart.setDate(weekStart.getDate() + (multi.week - 1) * 7)
      const dayOffset = ['월', '화', '수', '목', '금', '토', '일'].indexOf(multi.multi_day[0])
      weekStart.setDate(weekStart.getDate() + dayOffset)
      
      const eventDay = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
      return eventDay < today
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
            <p className="text-gray-600">리그 이벤트를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🏆 리그 이벤트
            </h1>
            <p className="text-gray-400">
              {filteredEvents.length}개의 리그 이벤트가 있습니다
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

        {/* 리그 설명 */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-purple-400 mb-3">🏆 리그란?</h2>
          <p className="text-gray-300 leading-relaxed">
            정식 리그 시스템으로 운영되는 공식 레이싱 이벤트입니다. 
            정해진 일정과 규칙에 따라 진행되며, 
            시즌별로 순위가 관리되어 더욱 체계적인 레이싱 경험을 제공합니다.
          </p>
        </div>
      </div>

      {/* 리그 이벤트 목록 */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} multi={event} currentUserId={null} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            리그 이벤트가 없습니다
          </h3>
          <p className="text-gray-500">
            {timeFilter === 'upcoming' ? '예정된 리그 이벤트가 없습니다' :
             timeFilter === 'past' ? '지난 리그 이벤트가 없습니다' :
             '등록된 리그 이벤트가 없습니다'}
          </p>
        </div>
      )}
    </div>
  )
}
