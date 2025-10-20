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
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mobile-px-4 mobile-py-4 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/50">
        <button
          onClick={goToPreviousMonth}
          className="mobile-px-4 mobile-py-3 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50 touch-button hover:bg-slate-600/50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h2 className="mobile-text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {year}년 {month + 1}월
          </h2>
          <div className="mobile-text-xs text-slate-400">캘린더</div>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="mobile-px-4 mobile-py-3 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50 touch-button hover:bg-slate-600/50 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600/30">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div 
            key={day}
            className={`mobile-py-3 text-center mobile-text-sm font-semibold ${
              index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-300'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 정기 갤멀 행 */}
      <div className="bg-slate-800/50 border-b border-slate-700 mobile-px-4 mobile-py-2">
        <div className="flex items-center space-x-2 mobile-mb-2">
          <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">정기</span>
          <span className="mobile-text-sm text-slate-300">정기 갤멀</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => {
            const regularEvents = events.filter(event => 
              event.event_type === 'regular_schedule' && 
              event.multi_day && 
              event.multi_day.includes(day)
            )
            
            return (
              <div key={day} className="mobile-px-1">
                {regularEvents.map((event, index) => (
                  <div 
                    key={index}
                    className="mobile-text-xs bg-cyan-500/20 text-cyan-300 mobile-px-1 mobile-py-0.5 rounded truncate mobile-mb-1"
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
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
              className={`mobile-calendar-day ${
                !isCurrentMonth ? 'text-slate-600' : 'text-slate-300'
              } ${
                isToday(date) ? 'today' : ''
              } ${
                isSelected(date) ? 'selected' : ''
              } ${
                hasEvents(date) ? 'has-events' : ''
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="mobile-text-sm font-medium">
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex space-x-1 mobile-mt-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="mobile-text-xs text-cyan-400">
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
        <div className="mobile-p-4 bg-slate-800 border-t border-slate-700">
          <h3 className="mobile-text-lg font-semibold mobile-mb-3">
            {new Date(selectedDate).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(new Date(selectedDate)).map((event, index) => (
              <div key={index} className="mobile-event-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="mobile-text-base font-medium mobile-mb-1">
                      {event.title}
                    </h4>
                    <div className="flex items-center space-x-2 mobile-text-sm text-slate-400">
                      <span>{event.game}</span>
                      {event.multi_time && (
                        <>
                          <span>•</span>
                          <span>{event.multi_time}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mobile-text-xs text-cyan-400">
                    {event.event_type === 'regular_schedule' ? '정기' : '기습'}
                  </div>
                </div>
              </div>
            ))}
            {getEventsForDate(new Date(selectedDate)).length === 0 && (
              <div className="mobile-text-sm text-slate-400 text-center mobile-py-4">
                이 날짜에는 이벤트가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
