'use client'

import { useState, useEffect } from 'react'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface EventCalendarProps {
  events: Multi[]
  selectedGame?: string
  onGameChange?: (game: string) => void
  onEventClick?: (event: Multi) => void
}

const GAME_OPTIONS = [
  { id: 'all', name: '전체', icon: '' },
  { id: '르망얼티밋', name: '르망얼티밋', icon: '' },
  { id: 'F1 25', name: 'F1 25', icon: '' },
  { id: '컴페티치오네', name: '컴페티치오네', icon: '' },
  { id: '오토모빌리스타2', name: '오토모빌리스타2', icon: '' },
  { id: '아세토코르사', name: '아세토코르사', icon: '' },
  { id: '그란투리스모7', name: '그란투리스모7', icon: '' },
  { id: '알펙터2', name: '알펙터2', icon: '' },
]

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

export default function EventCalendar({ events, selectedGame = 'all', onGameChange, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filteredEvents, setFilteredEvents] = useState<Multi[]>([])
  const [expandedDate, setExpandedDate] = useState<Date | null>(null)

  // 게임별 이벤트 필터링
  useEffect(() => {
    if (selectedGame === 'all') {
      setFilteredEvents(events)
    } else {
      const filtered = events.filter(event => event.game === selectedGame)
      setFilteredEvents(filtered)
    }
  }, [events, selectedGame])


  // 현재 월의 날짜들 생성
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  // 정기 갤멀 이벤트 가져오기 (요일별)
  const getRegularGalleryEvents = () => {
    return filteredEvents.filter(event => {
      const isRegular = event.event_type === 'regular_schedule'
        && Array.isArray(event.multi_day) && event.multi_day.length > 0
      return isRegular
    })
  }

  // 로컬 YYYY-MM-DD
  const toLocalDateString = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // 기습갤멀 이벤트 가져오기 (특정 날짜)
  const getFlashGalleryEvents = (date: Date) => {
    const dateStr = toLocalDateString(date)
    
    return filteredEvents.filter(event => {
      const isFlash = (!!event.event_date) && (
        event.event_type === 'flash_event' ||
        event.event_type === 'flash' ||
        event.event_type === null ||
        event.event_type === undefined
      )
      
      if (!isFlash) return false
      
      const eventDateStr = (event.event_date?.includes('T')
        ? event.event_date.split('T')[0]
        : event.event_date)
      return eventDateStr === dateStr
    })
  }

  // 특정 날짜의 이벤트 가져오기 (기습갤멀만)
  const getEventsForDate = (date: Date) => {
    return getFlashGalleryEvents(date)
  }

  // 게임별 색상 매핑 (활성화 상태 고려)
  const getGameColor = (game: string, isOpen: boolean = true) => {
    const colorMap: { [key: string]: string } = {
      'iracing': isOpen ? 'bg-blue-600' : 'bg-gray-500',
      'assettocorsa': isOpen ? 'bg-green-600' : 'bg-gray-500',
      'gran-turismo7': isOpen ? 'bg-purple-600' : 'bg-gray-500',
      'competizione': isOpen ? 'bg-yellow-600' : 'bg-gray-500',
      'lemans': isOpen ? 'bg-orange-600' : 'bg-gray-500',
      'f1-25': isOpen ? 'bg-red-600' : 'bg-gray-500',
      'automobilista2': isOpen ? 'bg-teal-600' : 'bg-gray-500',
      'ea-wrc': isOpen ? 'bg-emerald-600' : 'bg-gray-500',
    }
    return colorMap[game] || (isOpen ? 'bg-gray-600' : 'bg-gray-500')
  }

  // 날짜가 현재 월인지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            오늘
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ←
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* 게임 필터 */}
      {onGameChange && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">게임 선택</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {GAME_OPTIONS.map((game) => {
              const gameEventCount = game.id === 'all' 
                ? events.length 
                : events.filter(event => event.game === game.id).length
              
              return (
                <button
                  key={game.id}
                  onClick={() => onGameChange(game.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGame === game.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                  title={game.name}
                >
                  <span className="mr-2">{game.icon}</span>
                  <span>{game.name}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedGame === game.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {gameEventCount}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 요일 헤더 */}
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-400 bg-gray-800 rounded">
            {day}
          </div>
        ))}

        {/* 정기 갤멀 (요일별 고정) */}
        {DAYS_OF_WEEK.map((day) => {
          const regularEvents = getRegularGalleryEvents().filter(event => 
            event.multi_day && event.multi_day.includes(day)
          )
          
          return (
            <div key={`regular-${day}`} className="p-2 bg-gray-700/40 rounded min-h-[60px] border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-1">
                {/* <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">정기</span> */}
                <span className="text-xs text-gray-300 font-medium">정기 갤멀</span>
              </div>
              <div className="space-y-1">
                {regularEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`block w-full p-1 text-white text-xs rounded truncate hover:opacity-80 transition-all duration-200 ${getGameColor(event.game, event.is_open)} border border-white/10 ${!event.is_open ? 'opacity-60' : ''}`}
                    title={`${event.title} (${event.game}) ${event.is_open ? '[ON]' : '[OFF]'}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-75">
                        {GAME_OPTIONS.find(g => g.id === event.game)?.icon || '🎮'}
                      </span>
                      <span className="truncate">{event.title}</span>
                      {!event.is_open && <span className="text-xs opacity-50">[OFF]</span>}
                    </div>
                  </button>
                ))}
                {regularEvents.length > 2 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{regularEvents.length - 2}개 더
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 날짜 셀들 */}
        {calendarDays.map((date, index) => {
          const isToday = date.toDateString() === new Date().toDateString()
          const isCurrentMonthDay = isCurrentMonth(date)
          const dayEvents = getEventsForDate(date)
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border border-gray-700 rounded ${
                isCurrentMonthDay ? 'bg-gray-800' : 'bg-gray-900'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setExpandedDate(date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedDate(date) }}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonthDay ? 'text-white' : 'text-gray-500'
              } ${isToday ? 'text-blue-400' : ''}`}>
                {date.getDate()}
              </div>
              
              {/* 이벤트 목록 */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event)}
                    className={`block w-full p-1 text-white text-xs rounded hover:opacity-80 transition-all duration-200 truncate ${getGameColor(event.game, event.is_open)} ${!event.is_open ? 'opacity-60' : ''}`}
                    title={`${event.title} (${event.game}) ${event.is_open ? '[ON]' : '[OFF]'}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-75">
                        {GAME_OPTIONS.find(g => g.id === event.game)?.icon || '🎮'}
                      </span>
                      <span className="truncate">{event.title}</span>
                      {!event.is_open && <span className="text-xs opacity-50">[OFF]</span>}
                    </div>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                    +{dayEvents.length - 3}개 더
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 확대 모달 */}
      {expandedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setExpandedDate(null)}
        >
          <div
            className="w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div className="text-white font-semibold">
                {expandedDate.getFullYear()}년 {expandedDate.getMonth() + 1}월 {expandedDate.getDate()}일 ({DAYS_OF_WEEK[expandedDate.getDay()]})
              </div>
              <button
                className="px-3 py-1 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => setExpandedDate(null)}
              >
                닫기
              </button>
            </div>

            {/* 선택된 날짜의 기습갤멀 */}
            <div className="p-5 space-y-3">
              <div className="text-sm text-gray-300 mb-1">기습 갤멀</div>
              {getEventsForDate(expandedDate).length === 0 ? (
                <div className="text-sm text-gray-500">기습 갤멀 일정이 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  {getEventsForDate(expandedDate).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`block w-full px-3 py-2 rounded border border-gray-700 ${getGameColor(event.game, event.is_open)} hover:opacity-90 transition-colors ${!event.is_open ? 'opacity-60' : ''}`}
                      title={`${event.title} (${event.game}) ${event.is_open ? '[ON]' : '[OFF]'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-white">
                          <span>{GAME_OPTIONS.find(g => g.id === event.game)?.icon || '🎮'}</span>
                          <span className="font-medium truncate">{event.title}</span>
                          {!event.is_open && <span className="text-xs opacity-50">[OFF]</span>}
                        </div>
                        {event.multi_time && (
                          <span className="text-xs text-gray-200 bg-gray-800 px-2 py-1 rounded border border-gray-700">{event.multi_time}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 요일 고정 정기 갤멀 안내 */}
            <div className="px-5 pb-5">
              <div className="text-sm text-gray-300 mb-2">정기 갤멀</div>
              <div className="space-y-2">
                {getRegularGalleryEvents()
                  .filter(event => event.multi_day && event.multi_day.includes(DAYS_OF_WEEK[expandedDate.getDay()]))
                  .map(event => (
                    <button
                      key={`regular-${event.id}`}
                      onClick={() => onEventClick?.(event)}
                      className={`block w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white text-sm hover:opacity-90 transition-colors ${getGameColor(event.game, event.is_open)} ${!event.is_open ? 'opacity-60' : ''}`}
                      title={`${event.title} (${event.game}) ${event.is_open ? '[ON]' : '[OFF]'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{GAME_OPTIONS.find(g => g.id === event.game)?.icon || '🎮'}</span>
                        <span className="truncate">{event.title}</span>
                        {!event.is_open && <span className="text-xs opacity-50">[OFF]</span>}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이벤트 통계 */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-300">
              총 {filteredEvents.length}개의 이벤트
            </span>
            {selectedGame !== 'all' && (
              <span className="text-blue-400 flex items-center gap-1">
                <span>{GAME_OPTIONS.find(g => g.id === selectedGame)?.icon}</span>
                {GAME_OPTIONS.find(g => g.id === selectedGame)?.name} 필터 적용
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </div>
        </div>
      </div>
    </div>
  )
}
