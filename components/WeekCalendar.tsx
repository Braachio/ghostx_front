'use client'

import { useState } from 'react'

interface WeekCalendarProps {
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

export default function WeekCalendar({ selectedDate, onDateSelect }: WeekCalendarProps) {
  // 현재 월의 전체 캘린더 생성
  const getCurrentMonthCalendar = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    
    // 이번달 1일
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    
    // 이번달 1일이 포함된 주의 일요일
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - firstDay.getDay())
    
    // 이번달 마지막일이 포함된 주의 토요일
    const endDate = new Date(lastDay)
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
    
    const dates = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      // 새로운 Date 객체 생성 (참조 문제 방지)
      const dateObj = new Date(currentDate)
      const isCurrentMonth = dateObj.getMonth() === currentMonth
      const isToday = dateObj.toDateString() === now.toDateString()
      const isPast = dateObj < now && !isToday
      
      // 로컬 시간을 사용하여 타임존 문제 방지
      const year = dateObj.getFullYear()
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      const localDateString = `${year}-${month}-${day}`
      
      dates.push({
        date: localDateString,
        day: dateObj.getDay(),
        dayName: ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()],
        month: dateObj.getMonth() + 1,
        dayOfMonth: dateObj.getDate(),
        isCurrentMonth,
        isToday,
        isPast
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  const calendarDates = getCurrentMonthCalendar()

  const handleDateClick = (date: string) => {
    console.log('=== 캘린더 날짜 선택 디버깅 ===')
    console.log('선택된 날짜 문자열:', date)
    console.log('Date 객체 생성:', new Date(date))
    console.log('Date 객체 로컬 시간:', new Date(date).toLocaleString('ko-KR'))
    console.log('Date 객체 UTC 시간:', new Date(date).toISOString())
    console.log('현재 시간:', new Date().toLocaleString('ko-KR'))
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
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* 월 단위 캘린더 */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600/50 rounded-xl overflow-hidden shadow-2xl">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-gray-700 to-gray-800">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div key={day} className={`p-4 text-center text-sm font-bold border-r border-gray-600/50 last:border-r-0 ${
              index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-gray-200'
            }`}>
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDates.map((dayInfo) => (
            <button
              key={dayInfo.date}
              onClick={() => !dayInfo.isPast && handleDateClick(dayInfo.date)}
              disabled={dayInfo.isPast}
              className={`relative p-4 text-center transition-all duration-300 border-r border-b border-gray-600/30 last:border-r-0 group ${
                dayInfo.isPast
                  ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                  : selectedDate === dayInfo.date
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : dayInfo.isToday
                  ? 'bg-transparent text-white border-2 border-orange-400 hover:bg-orange-500/20'
                  : dayInfo.isCurrentMonth
                  ? 'bg-transparent text-white hover:bg-gray-600/40 hover:scale-105'
                  : 'bg-gray-800/20 text-gray-500 hover:bg-gray-600/30'
              } ${!dayInfo.isPast ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed'}`}
            >
              <div className={`text-lg font-bold transition-all duration-200 ${
                !dayInfo.isCurrentMonth ? 'text-gray-500' : ''
              } ${selectedDate === dayInfo.date ? 'text-white' : ''}`}>
                {dayInfo.dayOfMonth}
              </div>
              {selectedDate === dayInfo.date && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
