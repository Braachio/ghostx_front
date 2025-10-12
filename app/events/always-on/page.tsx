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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-green-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-400 text-lg">상시 서버를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 - 고스트카 테마 */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-pulse">🌐</div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
            ALWAYS-ON SERVERS
          </h1>
          <p className="text-gray-400 text-lg">
            {events.length}개의 상시 운영 서버 • 24시간 언제든 접속 가능
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
        </div>

        {/* 상시 서버 설명 카드 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-green-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                  상시 서버란?
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  24시간 언제든 접속하여 레이싱을 즐길 수 있는 상시 운영 서버입니다. 
                  정해진 시간 없이 자유롭게 참여할 수 있으며, 
                  다양한 트랙과 차량으로 레이싱을 즐기실 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 게임별 서버 목록 */}
        {Object.keys(eventsByGame).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(eventsByGame).map(([game, gameEvents]) => (
              <div key={game} className="relative">
                <div className="absolute inset-0 bg-green-500/5 rounded-2xl blur-xl"></div>
                <div className="relative bg-gray-900/90 rounded-2xl p-6 border border-green-500/30 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎮</span>
                      <h2 className="text-2xl font-bold text-white">{game}</h2>
                    </div>
                    <div className="px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-full">
                      <span className="text-green-300 text-sm font-semibold">
                        {gameEvents.length}개 서버
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {gameEvents.map(event => (
                      <EventCard key={event.id} multi={event} currentUserId={null} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block mb-6">
              <div className="text-8xl opacity-50">🌐</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-300 mb-3">
              상시 서버가 없습니다
            </h3>
            <p className="text-gray-500 text-lg">
              현재 운영 중인 상시 서버가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
