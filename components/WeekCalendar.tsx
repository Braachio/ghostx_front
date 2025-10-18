'use client'

import { useState } from 'react'

interface WeekCalendarProps {
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

export default function WeekCalendar({ selectedDate, onDateSelect }: WeekCalendarProps) {
  // 오늘부터 +7일까지 날짜 계산
  const getAvailableDates = () => {
    const now = new Date()
    const dates = []
    
    for (let i = 0; i <= 7; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      date.setHours(0, 0, 0, 0)
      
      dates.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        day: date.getDay(),
        dayName: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        month: date.getMonth() + 1,
        dayOfMonth: date.getDate(),
        isToday: i === 0,
        isPast: false // 오늘부터 +7일까지는 모두 미래
      })
    }
    
    return dates
  }

  const availableDates = getAvailableDates()

  const handleDateClick = (date: string) => {
    onDateSelect(date)
  }

  return (
    <div className="space-y-4">
      {/* 캘린더 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h3 className="text-lg font-semibold text-cyan-400">날짜 선택</h3>
        </div>
        <span className="text-sm text-gray-400">
          오늘부터 7일 후까지
        </span>
      </div>

      {/* 캘린더 테이블 */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gray-700">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-300 border-r border-gray-600 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {availableDates.map((dayInfo) => (
            <button
              key={dayInfo.date}
              onClick={() => handleDateClick(dayInfo.date)}
              className={`p-4 text-center transition-all duration-200 border-r border-b border-gray-600 last:border-r-0 hover:bg-gray-600/50 ${
                selectedDate === dayInfo.date
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : dayInfo.isToday
                  ? 'bg-orange-500 text-white'
                  : 'bg-transparent text-white hover:bg-gray-600/30'
              }`}
            >
              <div className="text-lg font-bold">{dayInfo.dayOfMonth}</div>
              {dayInfo.isToday && (
                <div className="text-xs mt-1 font-medium">오늘</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 날짜 정보 */}
      {selectedDate && (
        <div className="p-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg">
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
