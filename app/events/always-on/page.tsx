'use client'

import { useEffect, useState } from 'react'
import EventCard from '@/components/EventCard'
import { MultiWithTemplate } from '@/types/events'

export default function AlwaysOnServerPage() {
  const [events, setEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data: MultiWithTemplate[] = await response.json()
          
          // 상시 서버 이벤트만 필터링
          const alwaysOnEvents = data.filter(event => 
            event.event_type === 'always_on_server'
          )
          
          setEvents(alwaysOnEvents)
          
          // 게임 목록 추출
          const games = [...new Set(alwaysOnEvents.map(event => event.game))]
          setSelectedGames(games)
        }
      } catch (error) {
        console.error('상시 서버 조회 실패:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // 게임별로 그룹화
  const eventsByGame = events.reduce((acc, event) => {
    if (!acc[event.game]) {
      acc[event.game] = []
    }
    acc[event.game].push(event)
    return acc
  }, {} as Record<string, MultiWithTemplate[]>)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">상시 서버를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🌐 상시 서버
          </h1>
          <p className="text-gray-400">
            {events.length}개의 상시 운영 서버가 있습니다
          </p>
        </div>

        {/* 상시 서버 설명 */}
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-green-400 mb-3">🌐 상시 서버란?</h2>
          <p className="text-gray-300 leading-relaxed">
            24시간 언제든 접속하여 레이싱을 즐길 수 있는 상시 운영 서버입니다. 
            정해진 시간 없이 자유롭게 참여할 수 있으며, 
            다양한 트랙과 차량으로 레이싱을 즐기실 수 있습니다.
          </p>
        </div>
      </div>

      {/* 게임별 서버 목록 */}
      {Object.keys(eventsByGame).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(eventsByGame).map(([game, gameEvents]) => (
            <div key={game} className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🎮</span>
                <h2 className="text-xl font-bold text-white">{game}</h2>
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                  {gameEvents.length}개 서버
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {gameEvents.map(event => (
                  <EventCard key={event.id} multi={event} currentUserId={null} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            상시 서버가 없습니다
          </h3>
          <p className="text-gray-500">
            현재 운영 중인 상시 서버가 없습니다
          </p>
        </div>
      )}
    </div>
  )
}
