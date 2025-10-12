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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-400 text-lg">리그 이벤트를 불러오는 중...</p>
            </div>
          </div>
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
            <div className="text-7xl animate-pulse">🏆</div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            LEAGUE EVENTS
          </h1>
          <p className="text-gray-400 text-lg">
            {filteredEvents.length}개의 리그 이벤트 • 공식 레이싱 대회
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        </div>

        {/* 필터 */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex gap-2 p-1.5 bg-gray-900/90 border border-purple-500/30 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setTimeFilter('upcoming')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                timeFilter === 'upcoming'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 예정된 이벤트
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                timeFilter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📅 전체
            </button>
            <button
              onClick={() => setTimeFilter('past')}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                timeFilter === 'past'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📜 지난 이벤트
            </button>
          </div>
        </div>

        {/* 리그 설명 카드 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                  리그란?
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  정식 리그 시스템으로 운영되는 공식 레이싱 이벤트입니다. 
                  정해진 일정과 규칙에 따라 진행되며, 
                  시즌별로 순위가 관리되어 더욱 체계적인 레이싱 경험을 제공합니다.
                </p>
              </div>
            </div>
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
          <div className="text-center py-20">
            <div className="inline-block mb-6">
              <div className="text-8xl opacity-50">🏆</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-3">
              리그 이벤트가 없습니다
            </h3>
            <p className="text-gray-500 text-lg">
              {timeFilter === 'upcoming' ? '예정된 리그 이벤트가 없습니다' :
               timeFilter === 'past' ? '지난 리그 이벤트가 없습니다' :
               '등록된 리그 이벤트가 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
