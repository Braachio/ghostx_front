'use client'

import { useState, useEffect } from 'react'
import { EventTemplate, MultiWithTemplate } from '@/types/events'

export default function SchedulePage() {
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [flashEvents, setFlashEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0: 현재주, -1: 지난주, 1: 다음주

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 템플릿 데이터 가져오기
      const templatesResponse = await fetch('/api/event-templates')
      const templatesData = templatesResponse.ok ? await templatesResponse.json() : []
      
      // 기습갤멀 데이터 가져오기
      const eventsResponse = await fetch('/api/multis')
      const eventsData = eventsResponse.ok ? await eventsResponse.json() : []
      
      const flashEventsData = eventsData.filter((event: any) => 
        event.event_type === 'flash_event' || !event.event_type
      )
      
      setTemplates(templatesData)
      setFlashEvents(flashEventsData)
    } catch (error) {
      console.error('데이터 로드 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  // 주차별 날짜 계산
  const getWeekDates = (weekOffset: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
    
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysFromMonday + (weekOffset * 7))
    monday.setHours(0, 0, 0, 0)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const weekDates = getWeekDates(selectedWeek)
  const days = ['월', '화', '수', '목', '금', '토', '일']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>스케줄을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">📅 스케줄 통합 뷰</h1>
          <p className="text-gray-400">정기 스케줄, 상시 서버, 리그, 기습갤멀을 한눈에 확인합니다.</p>
        </div>

        {/* 주차 선택 */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← 이전 주
          </button>
          
          <div className="px-4 py-2 bg-green-600 text-white rounded-lg">
            {selectedWeek === 0 && '이번 주'}
            {selectedWeek === -1 && '지난 주'}
            {selectedWeek === 1 && '다음 주'}
            {selectedWeek !== 0 && selectedWeek !== -1 && selectedWeek !== 1 && `${selectedWeek > 0 ? '+' : ''}${selectedWeek}주`}
          </div>
          
          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            다음 주 →
          </button>
          
          <button
            onClick={() => setSelectedWeek(0)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            오늘로
          </button>
        </div>

        {/* 스케줄 테이블 */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 w-32">
                    날짜
                  </th>
                  {weekDates.map((date, index) => (
                    <th key={index} className="px-4 py-3 text-center text-sm font-semibold text-gray-300 min-w-[200px]">
                      <div>
                        <div className="text-xs text-gray-400">{days[index]}</div>
                        <div className="text-lg">{date.getDate()}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 정기 스케줄 */}
                <tr className="border-b border-gray-600">
                  <td className="px-4 py-3 bg-gray-700/50 text-sm font-medium text-gray-300">
                    🎯 정기 스케줄
                  </td>
                  {weekDates.map((date, index) => {
                    const dayName = days[index]
                    const dayTemplates = templates.filter(t => 
                      t.type === 'regular_schedule' && t.days.includes(dayName)
                    )
                    
                    return (
                      <td key={index} className="px-2 py-3 align-top">
                        {dayTemplates.map((template, idx) => (
                          <div key={idx} className="mb-2 p-2 bg-blue-600/20 border border-blue-500/30 rounded text-xs">
                            <div className="font-medium text-blue-300">{template.game}</div>
                            <div className="text-gray-300">{template.track}</div>
                            <div className="text-gray-400">{template.time}</div>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>

                {/* 상시 서버 */}
                <tr className="border-b border-gray-600">
                  <td className="px-4 py-3 bg-gray-700/50 text-sm font-medium text-gray-300">
                    🖥️ 상시 서버
                  </td>
                  {weekDates.map((date, index) => {
                    const dayName = days[index]
                    const serverTemplates = templates.filter(t => 
                      t.type === 'always_on_server' && t.days.includes(dayName)
                    )
                    
                    return (
                      <td key={index} className="px-2 py-3 align-top">
                        {serverTemplates.map((template, idx) => (
                          <div key={idx} className="mb-2 p-2 bg-green-600/20 border border-green-500/30 rounded text-xs">
                            <div className="font-medium text-green-300">{template.game}</div>
                            <div className="text-gray-300">{template.track}</div>
                            <div className="text-gray-400">24/7</div>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>

                {/* 리그 */}
                <tr className="border-b border-gray-600">
                  <td className="px-4 py-3 bg-gray-700/50 text-sm font-medium text-gray-300">
                    🏆 리그
                  </td>
                  {weekDates.map((date, index) => {
                    const dayName = days[index]
                    const leagueTemplates = templates.filter(t => 
                      t.type === 'league' && t.days.includes(dayName)
                    )
                    
                    return (
                      <td key={index} className="px-2 py-3 align-top">
                        {leagueTemplates.map((template, idx) => (
                          <div key={idx} className="mb-2 p-2 bg-purple-600/20 border border-purple-500/30 rounded text-xs">
                            <div className="font-medium text-purple-300">{template.game}</div>
                            <div className="text-gray-300">{template.track}</div>
                            <div className="text-gray-400">{template.time}</div>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>

                {/* 기습갤멀 */}
                <tr>
                  <td className="px-4 py-3 bg-gray-700/50 text-sm font-medium text-gray-300">
                    ⚡ 기습갤멀
                  </td>
                  {weekDates.map((date, index) => {
                    const dayEvents = flashEvents.filter(event => {
                      // 주차 기반 날짜 계산
                      if (event.year && event.week) {
                        const { getDateFromWeekAndDay } = require('@/app/utils/weekUtils')
                        const eventDate = getDateFromWeekAndDay(event.year, event.week, days[index])
                        return eventDate && eventDate.toDateString() === date.toDateString()
                      }
                      return false
                    })
                    
                    return (
                      <td key={index} className="px-2 py-3 align-top">
                        {dayEvents.map((event, idx) => (
                          <div key={idx} className="mb-2 p-2 bg-orange-600/20 border border-orange-500/30 rounded text-xs">
                            <div className="font-medium text-orange-300">{event.title}</div>
                            <div className="text-gray-300">{event.game}</div>
                            <div className="text-gray-400">{event.multi_time || '시간 미정'}</div>
                          </div>
                        ))}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 통계 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">
              {templates.filter(t => t.type === 'regular_schedule').length}
            </div>
            <div className="text-sm text-gray-400">정기 스케줄</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">
              {templates.filter(t => t.type === 'always_on_server').length}
            </div>
            <div className="text-sm text-gray-400">상시 서버</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              {templates.filter(t => t.type === 'league').length}
            </div>
            <div className="text-sm text-gray-400">리그</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-orange-400">
              {flashEvents.length}
            </div>
            <div className="text-sm text-gray-400">기습갤멀</div>
          </div>
        </div>
      </div>
    </div>
  )
}
