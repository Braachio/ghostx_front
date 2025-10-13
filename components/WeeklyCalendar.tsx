'use client'

import Link from 'next/link'
import { MultiWithTemplate } from '@/types/events'

interface WeeklyCalendarProps {
  events: MultiWithTemplate[]
  gameName: string
  gameSlug: string
}

// 요일 매핑
const dayNames = ['일', '월', '화', '수', '목', '금', '토']
const dayColors = [
  'text-red-400', // 일요일
  'text-gray-300', // 월요일
  'text-gray-300', // 화요일
  'text-gray-300', // 수요일
  'text-gray-300', // 목요일
  'text-gray-300', // 금요일
  'text-blue-400', // 토요일
]

export default function WeeklyCalendar({ events, gameSlug }: WeeklyCalendarProps) {
  // 현재 날짜 기준으로 이번 주 계산
  const getCurrentWeekDates = () => {
    const now = new Date()
    const currentDay = now.getDay() // 0: 일요일, 6: 토요일
    
    // 이번 주 일요일 찾기
    const thisWeekSunday = new Date(now)
    thisWeekSunday.setDate(now.getDate() - currentDay)
    
    // 해당 주의 모든 날짜 생성
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(thisWeekSunday)
      date.setDate(thisWeekSunday.getDate() + i)
      weekDates.push(date)
    }
    
    return weekDates
  }

  // 특정 날짜와 시간에 해당하는 이벤트 찾기
  const getEventsForDay = (date: Date) => {
    const dayOfWeek = date.getDay()
    
    // 영어 요일명 배열 (0: Sunday, 6: Saturday)
    const englishDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const englishDayName = englishDayNames[dayOfWeek]
    const koreanDayName = dayNames[dayOfWeek]
    
    console.log(`요일별 이벤트 확인 - ${koreanDayName}요일 (${englishDayName}):`, {
      dayOfWeek,
      englishDayName,
      koreanDayName,
      totalEvents: events.length,
      events: events.map(e => ({ title: e.title, multi_day: e.multi_day }))
    })
    
    const dayEvents = events.filter(event => {
      // multi_day 배열에 해당 요일이 있는지 확인
      if (!event.multi_day || !Array.isArray(event.multi_day)) {
        console.log(`이벤트 ${event.title}: multi_day가 없거나 배열이 아님`, event.multi_day)
        return false
      }
      
      // 한글 요일과 영어 요일 모두 확인
      const hasEnglishDay = event.multi_day.includes(englishDayName)
      const hasKoreanDay = event.multi_day.includes(koreanDayName)
      const hasDay = hasEnglishDay || hasKoreanDay
      
      console.log(`이벤트 ${event.title}: ${koreanDayName}/${englishDayName} 포함 여부`, {
        hasKoreanDay,
        hasEnglishDay,
        hasDay,
        multi_day: event.multi_day
      })
      return hasDay
    })
    
    console.log(`${koreanDayName}요일 필터링 결과:`, dayEvents.map(e => e.title))
    return dayEvents
  }

  // 날짜가 오늘인지 확인
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // 날짜가 과거인지 확인
  // const isPast = (date: Date) => {
  //   const today = new Date()
  //   today.setHours(0, 0, 0, 0)
  //   const checkDate = new Date(date)
  //   checkDate.setHours(0, 0, 0, 0)
  //   return checkDate < today
  // }

  const weekDates = getCurrentWeekDates()

  return (
    <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-6 backdrop-blur-sm">
      {/* 캘린더 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          📅 매주 반복 일정
        </h2>
        <p className="text-gray-400 mt-2">정기 멀티레이스는 매주 같은 요일에 열립니다</p>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
        {dayNames.map((day, index) => (
          <div key={day} className={`text-center font-semibold py-2 text-sm md:text-base ${dayColors[index]}`}>
            {day}
          </div>
        ))}
      </div>

      {/* 날짜와 이벤트 */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDates.map((date, index) => {
          const dayEvents = getEventsForDay(date)
          const today = isToday(date)
          // const past = isPast(date)
          
          return (
            <div
              key={index}
              className={`min-h-[100px] md:min-h-[120px] p-2 md:p-3 rounded-lg border transition-all ${
                today
                  ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50'
                  : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
              }`}
            >
              {/* 오늘 표시 */}
              {today && (
                <div className="text-center mb-2">
                  <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                    오늘
                  </span>
                </div>
              )}

              {/* 이벤트 목록 */}
              <div className="space-y-1">
                {dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/regular/${gameSlug}/${event.id}`}
                    className={`block p-1.5 md:p-2 rounded text-xs md:text-sm transition-all hover:scale-105 ${
                      today
                        ? 'bg-blue-600/80 hover:bg-blue-500/80 text-white'
                        : 'bg-cyan-600/80 hover:bg-cyan-500/80 text-white'
                    }`}
                  >
                    <div className="font-semibold truncate text-xs md:text-sm">{event.title}</div>
                    <div className="text-xs opacity-80 hidden md:block">
                      {event.multi_time}
                    </div>
                  </Link>
                ))}
              </div>

              {/* 이벤트가 없을 때 */}
              {dayEvents.length === 0 && (
                <div className="text-center text-xs text-gray-500">
                  -
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600/80 rounded"></div>
          <span className="text-gray-300">오늘</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cyan-600/80 rounded"></div>
          <span className="text-gray-300">정기 이벤트</span>
        </div>
      </div>
    </div>
  )
}
