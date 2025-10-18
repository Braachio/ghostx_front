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
          {calendarDates.map((dayInfo) => (
            <button
              key={dayInfo.date}
              onClick={() => !dayInfo.isPast && handleDateClick(dayInfo.date)}
              disabled={dayInfo.isPast}
              className={`p-3 text-center transition-all duration-200 border-r border-b border-gray-600 last:border-r-0 ${
                dayInfo.isPast
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : selectedDate === dayInfo.date
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : dayInfo.isToday
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : dayInfo.isCurrentMonth
                  ? 'bg-transparent text-white hover:bg-gray-600/30'
                  : 'bg-gray-800/30 text-gray-500 hover:bg-gray-600/20'
              } ${!dayInfo.isPast ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            >
              <div className={`text-sm font-medium ${!dayInfo.isCurrentMonth ? 'text-gray-500' : ''}`}>
                {dayInfo.dayOfMonth}
              </div>
              {dayInfo.isToday && (
                <div className="text-xs mt-1 font-bold">오늘</div>
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
