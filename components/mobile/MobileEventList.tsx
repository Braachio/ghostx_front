'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Multi } from '../../types/events'

interface MobileEventListProps {
  events: Multi[]
  selectedDate: string | null
}

export default function MobileEventList({ events, selectedDate }: MobileEventListProps) {
  const [filter, setFilter] = useState<'all' | 'regular' | 'flash'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')

  // 이벤트 필터링 및 정렬
  const filteredEvents = useMemo(() => {
    let filtered = events

    // 타입별 필터링
    if (filter === 'regular') {
      filtered = filtered.filter(event => event.event_type === 'regular_schedule')
    } else if (filter === 'flash') {
      filtered = filtered.filter(event => 
        event.event_type === 'flash_event' || 
        event.event_type === 'flash' || 
        !event.event_type
      )
    }

    // 날짜별 필터링
    if (selectedDate) {
      filtered = filtered.filter(event => {
        if (event.event_date) {
          return event.event_date === selectedDate
        }
        // 정기 갤멀의 경우 요일 매칭
        if (event.event_type === 'regular_schedule' && event.multi_day) {
          const dayNames = ['일', '월', '화', '수', '목', '금', '토']
          const dayName = dayNames[new Date(selectedDate).getDay()]
          return event.multi_day.includes(dayName)
        }
        return false
      })
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.event_date || a.created_at)
        const dateB = new Date(b.event_date || b.created_at)
        return dateB.getTime() - dateA.getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

    return filtered
  }, [events, filter, selectedDate, sortBy])

  // 이벤트 날짜 포맷팅
  const formatEventDate = (event: Multi) => {
    if (event.event_date) {
      const date = new Date(event.event_date)
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      })
    }
    if (event.multi_day) {
      return event.multi_day
    }
    return '날짜 미정'
  }

  // 이벤트 시간 포맷팅
  const formatEventTime = (event: Multi) => {
    if (event.multi_time) {
      return event.multi_time
    }
    return ''
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* 필터 및 정렬 */}
      <div className="mobile-p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex space-x-2 mobile-mb-3">
          <button
            onClick={() => setFilter('all')}
            className={`mobile-px-3 mobile-py-2 rounded-lg mobile-text-sm touch-button ${
              filter === 'all' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('regular')}
            className={`mobile-px-3 mobile-py-2 rounded-lg mobile-text-sm touch-button ${
              filter === 'regular' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            정기 갤멀
          </button>
          <button
            onClick={() => setFilter('flash')}
            className={`mobile-px-3 mobile-py-2 rounded-lg mobile-text-sm touch-button ${
              filter === 'flash' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            기습 갤멀
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="mobile-text-sm text-slate-400">
            총 {filteredEvents.length}개 이벤트
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
            className="mobile-px-3 mobile-py-2 bg-slate-700 border border-slate-600 rounded-lg mobile-text-sm"
          >
            <option value="date">날짜순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>

      {/* 이벤트 목록 */}
      <div className="flex-1 overflow-y-auto smooth-scroll">
        <div className="mobile-p-4 space-y-3">
          {filteredEvents.map((event, index) => (
            <Link 
              key={event.id || index}
              href={`/multis/${event.id}`}
              className="block"
            >
              <div className="mobile-event-card">
                <div className="flex items-start justify-between mobile-mb-2">
                  <div className="flex-1">
                    <h3 className="mobile-text-base font-medium mobile-mb-1 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex items-center space-x-2 mobile-text-sm text-slate-400">
                      <span>{event.game}</span>
                      {event.multi_class && (
                        <>
                          <span>•</span>
                          <span>{event.multi_class}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`mobile-text-xs px-2 py-1 rounded ${
                      event.event_type === 'regular_schedule' 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : 'bg-orange-500/20 text-orange-300'
                    }`}>
                      {event.event_type === 'regular_schedule' ? '정기' : '기습'}
                    </span>
                    {event.is_open && (
                      <span className="mobile-text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                        진행중
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mobile-text-sm text-slate-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatEventDate(event)}</span>
                    </span>
                    {formatEventTime(event) && (
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatEventTime(event)}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {event.description && (
                  <div className="mobile-mt-2 mobile-text-sm text-slate-400 line-clamp-2">
                    {event.description}
                  </div>
                )}
              </div>
            </Link>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center mobile-py-8">
              <div className="mobile-text-lg text-slate-400 mobile-mb-2">
                이벤트가 없습니다
              </div>
              <div className="mobile-text-sm text-slate-500">
                {filter === 'all' 
                  ? '등록된 이벤트가 없습니다.' 
                  : `${filter === 'regular' ? '정기' : '기습'} 갤멀이 없습니다.`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
