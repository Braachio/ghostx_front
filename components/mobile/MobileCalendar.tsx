'use client'

import { useState, useMemo } from 'react'
import { Multi } from '../../types/events'

interface MobileCalendarProps {
  events: Multi[]
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

export default function MobileCalendar({ events, selectedDate, onDateSelect }: MobileCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const today = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

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
    return events.filter(event => {
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
    onDateSelect(dateStr)
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

  return (
    <div className="mobile-calendar">
      {/* 월 네비게이션 - 아이폰 스타일 */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <button
          onClick={goToPreviousMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 touch-button transition-all"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {year}년 {month + 1}월
          </h2>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 touch-button transition-all"
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
            className={`py-3 text-center text-sm font-medium ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 정기 갤멀 행 - 아이폰 스타일 */}
      <div className="bg-blue-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">정기</span>
          <span className="text-sm text-gray-700 font-medium">정기 갤멀</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => {
            const regularEvents = events.filter(event => 
              event.event_type === 'regular_schedule' && 
              event.multi_day && 
              event.multi_day.includes(day)
            )
            
            return (
              <div key={day} className="px-1">
                {regularEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full truncate mb-1 font-medium"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* 캘린더 그리드 - 아이폰 스타일 */}
      <div className="grid grid-cols-7 bg-white">
        {calendarData.map((date, index) => {
          const dayEvents = getEventsForDate(date)
          const isCurrentMonth = date.getMonth() === month
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`mobile-calendar-day relative ${
                !isCurrentMonth ? 'text-gray-300' : 'text-gray-900'
              } ${
                isToday(date) ? 'today' : ''
              } ${
                isSelected(date) ? 'selected' : ''
              } ${
                hasEvents(date) ? 'has-events' : ''
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-base font-medium">
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex space-x-1 mt-1">
                    {dayEvents.slice(0, 3).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-blue-500 font-medium">
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
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </h3>
          <div className="space-y-3">
            {getEventsForDate(new Date(selectedDate)).map((event, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-gray-900 mb-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{event.game}</span>
                      {event.multi_time && (
                        <>
                          <span>•</span>
                          <span>{event.multi_time}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                    {event.event_type === 'regular_schedule' ? '정기' : '기습'}
                  </div>
                </div>
              </div>
            ))}
            {getEventsForDate(new Date(selectedDate)).length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                이 날짜에는 이벤트가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
