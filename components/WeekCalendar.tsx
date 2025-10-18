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
      {/* 날짜 선택 헤더 */}
      <div className="flex items-center gap-2">
        <span className="text-lg">📅</span>
        <h3 className="text-lg font-semibold text-cyan-400">날짜 선택</h3>
        <span className="text-sm text-gray-400">
          오늘부터 7일 후까지
        </span>
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-4 gap-3">
        {availableDates.map((dayInfo) => (
          <button
            key={dayInfo.date}
            onClick={() => handleDateClick(dayInfo.date)}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              selectedDate === dayInfo.date
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                : dayInfo.isToday
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-700 hover:bg-gray-600 text-white hover:shadow-lg hover:scale-105'
            } cursor-pointer`}
          >
            <div className="text-xs text-gray-300 mb-1">{dayInfo.dayName}</div>
            <div className="text-lg font-bold">{dayInfo.dayOfMonth}</div>
            <div className="text-xs text-gray-300">{dayInfo.month}월</div>
            {dayInfo.isToday && <div className="text-xs mt-1 font-bold">오늘</div>}
          </button>
        ))}
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
