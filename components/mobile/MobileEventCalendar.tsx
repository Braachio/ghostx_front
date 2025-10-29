'use client'

import { useState, useMemo } from 'react'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface MobileEventCalendarProps {
  events: Multi[]
  selectedGame: string
  onGameChange: (game: string) => void
  onEventClick?: (event: Multi) => void
}

export default function MobileEventCalendar({ 
  events, 
  selectedGame, 
  onGameChange, 
  onEventClick
}: MobileEventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // 게임 필터링 및 지난 기습 갤멀 제거
  const filteredEvents = useMemo(() => {
    let filtered = events
    
    // 게임 필터링
    if (selectedGame !== '전체') {
      filtered = filtered.filter(event => event.game === selectedGame)
    }
    
    // 지난 기습 갤멀 제거
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 오늘 00:00:00으로 설정
    
    filtered = filtered.filter(event => {
      // 정기 갤멀은 항상 표시
      if (event.event_type === 'regular_schedule') {
        return true
      }
      
      // 기습 갤멀은 날짜가 지나지 않은 것만 표시
      if (event.event_type === 'flash_event') {
        if (!event.event_date) return true // 날짜가 없으면 표시
        
        const eventDate = new Date(event.event_date)
        eventDate.setHours(0, 0, 0, 0) // 이벤트 날짜 00:00:00으로 설정
        
        return eventDate >= today
      }
      
      return true
    })
    
    return filtered
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

  // 특정 날짜의 이벤트 가져오기 (지난 기습 갤멀 제외)
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
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
    }).filter(event => {
      // 기습 갤멀의 경우 날짜가 지나지 않은 것만 표시
      if (event.event_type === 'flash_event' && event.event_date) {
        const eventDate = new Date(event.event_date)
        eventDate.setHours(0, 0, 0, 0)
        return eventDate >= today
      }
      return true
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
    // 로컬 시간대를 유지하여 날짜 문자열 생성
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    setSelectedDate(dateStr)
  }

  // 오늘인지 확인
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  // 선택된 날짜인지 확인
  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    // 로컬 시간대를 유지하여 날짜 문자열 생성
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return dateStr === selectedDate
  }

  // 게임 목록 가져오기 - 정렬된 순서
  const games = useMemo(() => {
    const gameSet = new Set(events.map(event => event.game))
    const orderedGames = [
      '컴페티치오네',
      '르망얼티밋', 
      '아세토코르사',
      'F1 25',
      '오토모빌리스타2',
      '알펙터2',
      '그란투리스모7',
      '아이레이싱'
    ]
    
    // 실제 이벤트에 있는 게임만 필터링하고 순서대로 정렬
    const filteredGames = orderedGames.filter(game => gameSet.has(game))
    
    return ['전체', ...filteredGames]
  }, [events])

  return (
    <div className="w-full">
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
              {game}
            </button>
          ))}
        </div>
      </div>

      {
        <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 월 네비게이션 - 아이폰 스타일 */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2 bg-white border-b border-gray-200">
            <button
              onClick={goToPreviousMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                {year}년 {month + 1}월
              </h2>
            </div>
            
            <button
              onClick={goToNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 요일 헤더 - 아이폰 스타일 */}
          <div className="grid grid-cols-7 bg-white border-b border-gray-200">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div 
                key={day}
                className={`py-2 text-center text-xs font-medium ${
                  index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 - 아이폰 스타일 */}
          <div className="grid grid-cols-7 bg-white">
            {calendarData.map((date, index) => {
              const dayEvents = getEventsForDate(date)
              const isCurrentMonth = date.getMonth() === month
              const isTodayDate = isToday(date)
              const isSelectedDate = isSelected(date)
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`relative h-12 sm:h-14 transition-all ${
                    !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                  } ${
                    isTodayDate ? 'bg-blue-500 text-white rounded-full mx-1 my-0.5' : ''
                  } ${
                    isSelectedDate && !isTodayDate ? 'bg-blue-100 text-blue-600 rounded-full mx-1 my-0.5' : ''
                  } hover:bg-gray-100 active:scale-95`}
                >
                  <div className="relative flex flex-col items-center justify-start h-full pt-1.5">
                    <span className={`text-base sm:text-lg font-medium ${
                      isTodayDate ? 'text-white' : isSelectedDate ? 'text-blue-600' : ''
                    }`}>
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 flex items-center space-x-0.5">
                        {dayEvents.slice(0, 3).map((event, eventIndex) => {
                          const isFlashEvent = event.event_type === 'flash_event'
                          return (
                            <div
                              key={eventIndex}
                              className={`w-1 h-1 rounded-full ${
                                isTodayDate 
                                  ? 'bg-white' 
                                  : isFlashEvent 
                                    ? 'bg-orange-500' 
                                    : 'bg-blue-500'
                              }`}
                            />
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <div className={`text-[10px] font-medium ${
                            isTodayDate ? 'text-white' : 'text-blue-500'
                          }`}>
                            +{dayEvents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* 선택된 날짜의 이벤트 목록 - 아이폰 스타일 */}
          {selectedDate && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                {(() => {
                  // selectedDate는 YYYY-MM-DD 형식이므로 직접 파싱
                  const [year, month, day] = selectedDate.split('-').map(Number)
                  const date = new Date(year, month - 1, day)
                  return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })
                })()}
              </h3>
              <div className="space-y-2">
                {getEventsForDate((() => {
                  const [year, month, day] = selectedDate.split('-').map(Number)
                  return new Date(year, month - 1, day)
                })()).map((event, index) => (
                  <div
                    key={index}
                    onClick={() => onEventClick?.(event)}
                    className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        event.event_type === 'flash_event' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.game} • {event.event_type === 'regular_schedule' ? '정기 갤멀' : '기습 갤멀'}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
                {getEventsForDate((() => {
                  const [year, month, day] = selectedDate.split('-').map(Number)
                  return new Date(year, month - 1, day)
                })()).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">이 날에는 일정이 없습니다</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      }
    </div>
  )
}

