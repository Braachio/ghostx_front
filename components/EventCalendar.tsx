'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface EventCalendarProps {
  events: Multi[]
  selectedGame?: string
  onGameChange?: (game: string) => void
}

const GAME_OPTIONS = [
  { id: 'all', name: '전체', icon: '🎮' },
  { id: 'new', name: 'New', icon: '🆕' },
  { id: '르망얼티밋', name: '르망얼티밋', icon: '🏎️' },
  { id: 'F1 25', name: 'F1 25', icon: '🏎️' },
  { id: '컴페티치오네', name: '컴페티치오네', icon: '🏆' },
  { id: '오토모빌리스타2', name: '오토모빌리스타2', icon: '🏎️' },
  { id: 'EA WRC', name: 'EA WRC', icon: '🌲' },
  { id: '아세토코르사', name: '아세토코르사', icon: '🏎️' },
  { id: '그란투리스모', name: '그란투리스모', icon: '🏁' },
  { id: '알펙터2', name: '알펙터2', icon: '🏎️' },
]

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토']

export default function EventCalendar({ events, selectedGame = 'all', onGameChange }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filteredEvents, setFilteredEvents] = useState<Multi[]>([])

  // 게임별 이벤트 필터링
  useEffect(() => {
    console.log('=== EventCalendar 필터링 시작 ===')
    console.log('전체 이벤트:', events.length, '개')
    console.log('선택된 게임:', selectedGame)
    
    // 실제 게임 필드 값들 확인
    if (events.length > 0) {
      const gameValues = [...new Set(events.map(event => event.game))]
      console.log('실제 게임 필드 값들:', gameValues)
      
      // GAME_OPTIONS의 id 값들 확인
      const optionIds = GAME_OPTIONS.map(option => option.id)
      console.log('GAME_OPTIONS id 값들:', optionIds)
      
      // 매칭 확인
      gameValues.forEach(gameValue => {
        const matched = optionIds.includes(gameValue)
        console.log(`게임 "${gameValue}" 매칭 여부:`, matched)
      })
    }
    
    if (selectedGame === 'all') {
      setFilteredEvents(events)
      console.log('전체 이벤트 표시:', events.length, '개')
    } else {
      const filtered = events.filter(event => event.game === selectedGame)
      setFilteredEvents(filtered)
      console.log('필터링된 이벤트:', filtered.length, '개')
      console.log('필터링 조건:', `event.game === "${selectedGame}"`)
    }
    console.log('=== EventCalendar 필터링 완료 ===')
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

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredEvents.filter(event => {
      if (!event.multi_day || !Array.isArray(event.multi_day)) return false
      return event.multi_day.includes(dateStr)
    })
  }

  // 게임별 색상 매핑
  const getGameColor = (game: string) => {
    const colorMap: { [key: string]: string } = {
      'iracing': 'bg-blue-600',
      'assettocorsa': 'bg-green-600',
      'gran-turismo7': 'bg-purple-600',
      'competizione': 'bg-yellow-600',
      'lemans': 'bg-orange-600',
      'f1-25': 'bg-red-600',
      'automobilista2': 'bg-teal-600',
      'ea-wrc': 'bg-emerald-600',
    }
    return colorMap[game] || 'bg-gray-600'
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedGame === game.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
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
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonthDay ? 'text-white' : 'text-gray-500'
              } ${isToday ? 'text-blue-400' : ''}`}>
                {date.getDate()}
              </div>
              
              {/* 이벤트 목록 */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/regular/${event.game}/${event.id}`}
                    className={`block p-1 text-white text-xs rounded hover:opacity-80 transition-all duration-200 truncate ${getGameColor(event.game)}`}
                    title={`${event.title} (${event.game})`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-75">
                        {GAME_OPTIONS.find(g => g.id === event.game)?.icon || '🎮'}
                      </span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  </Link>
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
