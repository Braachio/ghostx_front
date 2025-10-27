'use client'

import { useState, useMemo } from 'react'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface MobileEventCalendarProps {
  events: Multi[]
  selectedGame: string
  onGameChange: (game: string) => void
  onEventClick?: (event: Multi) => void
  activeTab: 'calendar' | 'events'
  onTabChange: (tab: 'calendar' | 'events') => void
}

export default function MobileEventCalendar({ 
  events, 
  selectedGame, 
  onGameChange, 
  onEventClick,
  activeTab,
  onTabChange 
}: MobileEventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // 게임 필터링
  const filteredEvents = useMemo(() => {
    if (selectedGame === 'all') return events
    return events.filter(event => event.game === selectedGame)
  }, [events, selectedGame])

  // 현재 월의 캘린더 데이터 생성
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 일요일부터 시작

    const days = []
    const current = new Date(startDate)

    // 6주 (42일) 생성
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [year, month])

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(event => {
      if (event.event_date) {
        return event.event_date === dateStr
      }
      // 정기 갤멀의 경우 multi_day와 요일 매칭
      if (event.event_type === 'regular_schedule' && event.multi_day) {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토']
        const dayName = dayNames[date.getDay()]
        return event.multi_day.includes(dayName)
      }
      return false
    })
  }

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  // 날짜 선택
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    setSelectedDate(dateStr)
  }

  // 오늘인지 확인
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  // 선택된 날짜인지 확인
  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    return date.toISOString().split('T')[0] === selectedDate
  }

  // 이벤트가 있는 날인지 확인
  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  // 게임 목록 가져오기
  const games = useMemo(() => {
    const gameSet = new Set(events.map(event => event.game))
    return ['all', ...Array.from(gameSet)].sort()
  }, [events])

  return (
    <div className="w-full">
      {/* 탭 네비게이션 */}
      <div className="flex bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 mb-6">
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'calendar'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📅 캘린더
        </button>
        <button
          onClick={() => onTabChange('events')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'events'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📋 이벤트 목록
        </button>
      </div>

      {/* 게임 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {games.map(game => (
            <button
              key={game}
              onClick={() => onGameChange(game)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedGame === game
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {game === 'all' ? '전체' : game}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'calendar' ? (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
            <button
              onClick={goToPreviousMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-all"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                {year}년 {month + 1}월
              </h2>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-all"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-800/30 border-b border-gray-700/50">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div 
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7">
            {calendarData.map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const isCurrentMonth = date.getMonth() === month
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`relative h-12 text-xs transition-all ${
                    !isCurrentMonth ? 'text-gray-600' : 'text-gray-200'
                  } ${
                    isToday(date) ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20' : ''
                  } ${
                    isSelected(date) ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30' : ''
                  } ${
                    hasEvents(date) ? 'border-l-2 border-cyan-400' : ''
                  } hover:bg-gray-700/30`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="font-medium">
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex space-x-0.5 mt-0.5">
                        {dayEvents.slice(0, 2).map((_, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="w-1 h-1 bg-cyan-400 rounded-full"
                          />
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-cyan-400 font-medium">
                            +{dayEvents.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* 선택된 날짜의 이벤트 목록 */}
          {selectedDate && (
            <div className="px-4 py-4 bg-gray-800/30 border-t border-gray-700/50">
              <h3 className="text-base font-semibold text-white mb-3">
                {new Date(selectedDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              <div className="space-y-2">
                {getEventsForDate(new Date(selectedDate)).map((event, index) => (
                  <button
                    key={index}
                    onClick={() => onEventClick?.(event)}
                    className="w-full bg-gray-700/50 rounded-lg p-3 border border-gray-600/50 hover:bg-gray-600/50 transition-all text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-1">
                          {event.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>{event.game}</span>
                          {event.multi_time && (
                            <>
                              <span>•</span>
                              <span>{event.multi_time}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        event.event_type === 'regular_schedule' 
                          ? 'bg-blue-600/20 text-blue-400' 
                          : 'bg-orange-600/20 text-orange-400'
                      }`}>
                        {event.event_type === 'regular_schedule' ? '정기' : '기습'}
                      </div>
                    </div>
                  </button>
                ))}
                {getEventsForDate(new Date(selectedDate)).length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-6">
                    이 날짜에는 이벤트가 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 이벤트 목록 탭 */
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-400">이벤트가 없습니다.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>{event.game}</span>
                      {event.multi_time && (
                        <>
                          <span>•</span>
                          <span>{event.multi_time}</span>
                        </>
                      )}
                      {event.event_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(event.event_date).toLocaleDateString('ko-KR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    event.event_type === 'regular_schedule' 
                      ? 'bg-blue-600/20 text-blue-400' 
                      : 'bg-orange-600/20 text-orange-400'
                  }`}>
                    {event.event_type === 'regular_schedule' ? '정기' : '기습'}
                  </div>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {event.description}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
