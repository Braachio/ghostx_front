'use client'

import { useState } from 'react'

interface WeekCalendarProps {
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

export default function WeekCalendar({ selectedDate, onDateSelect }: WeekCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(0) // 0: 이번주, 1: 다음주

  // 이번주와 다음주 날짜 계산
  const getWeekDates = (weekOffset: number) => {
    const now = new Date()
    const currentDay = now.getDay() // 0(일) ~ 6(토)
    
    // 이번주 일요일 계산
    const thisWeekSunday = new Date(now)
    thisWeekSunday.setDate(now.getDate() - currentDay)
    thisWeekSunday.setHours(0, 0, 0, 0)
    
    // 주차 오프셋 적용
    const targetWeekSunday = new Date(thisWeekSunday)
    targetWeekSunday.setDate(thisWeekSunday.getDate() + (weekOffset * 7))
    
    // 일주일 날짜 배열 생성
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(targetWeekSunday)
      date.setDate(targetWeekSunday.getDate() + i)
      weekDates.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        day: date.getDay(),
        dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        month: date.getMonth() + 1,
        dayOfMonth: date.getDate(),
        isToday: date.toDateString() === now.toDateString(),
        isPast: date < now && date.toDateString() !== now.toDateString()
      })
    }
    
    return weekDates
  }

  const thisWeekDates = getWeekDates(0)
  const nextWeekDates = getWeekDates(1)

  const handleDateClick = (date: string) => {
    onDateSelect(date)
  }

  return (
    <div className="space-y-6">
      {/* 이번주 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h3 className="text-lg font-semibold text-cyan-400">이번주</h3>
          <span className="text-sm text-gray-400">
            {thisWeekDates[0].month}/{thisWeekDates[0].dayOfMonth} ~ {thisWeekDates[6].month}/{thisWeekDates[6].dayOfMonth}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {thisWeekDates.map((dayInfo) => (
            <button
              key={dayInfo.date}
              onClick={() => handleDateClick(dayInfo.date)}
              className={`p-3 rounded-lg text-center transition-all duration-200 ${
                selectedDate === dayInfo.date
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                  : dayInfo.isToday
                  ? 'bg-orange-500 text-white'
                  : dayInfo.isPast
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white hover:shadow-lg'
              } ${dayInfo.isPast ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={dayInfo.isPast}
            >
              <div className="text-xs text-gray-300 mb-1">{dayInfo.dayName}</div>
              <div className="text-sm font-medium">{dayInfo.dayOfMonth}</div>
              {dayInfo.isToday && <div className="text-xs mt-1">오늘</div>}
            </button>
          ))}
        </div>
      </div>

      {/* 다음주 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h3 className="text-lg font-semibold text-blue-400">다음주</h3>
          <span className="text-sm text-gray-400">
            {nextWeekDates[0].month}/{nextWeekDates[0].dayOfMonth} ~ {nextWeekDates[6].month}/{nextWeekDates[6].dayOfMonth}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {nextWeekDates.map((dayInfo) => (
            <button
              key={dayInfo.date}
              onClick={() => handleDateClick(dayInfo.date)}
              className={`p-3 rounded-lg text-center transition-all duration-200 ${
                selectedDate === dayInfo.date
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-700 hover:bg-gray-600 text-white hover:shadow-lg'
              } cursor-pointer`}
            >
              <div className="text-xs text-gray-300 mb-1">{dayInfo.dayName}</div>
              <div className="text-sm font-medium">{dayInfo.dayOfMonth}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 날짜 정보 */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✅</span>
            <span className="text-white font-medium">
              선택된 날짜: {new Date(selectedDate).toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
