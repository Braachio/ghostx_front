'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MobileEventsPage() {
  const [events, setEvents] = useState<Multi[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<string>('전체')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/multis')
        if (res.ok) {
          const data = await res.json()
          setEvents(Array.isArray(data) ? data : [])
        } else {
          setEvents([])
        }
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const games = useMemo(() => {
    const gameSet = new Set(events.map(e => e.game))
    const ordered = [
      '컴페티치오네', '르망얼티밋', '아세토코르사', 'F1 25',
      '오토모빌리스타2', '알펙터2', '그란투리스모7', '아이레이싱'
    ]
    const filtered = ordered.filter(g => gameSet.has(g))
    return ['전체', ...filtered]
  }, [events])

  const filteredEvents = useMemo(() => {
    let list = events
    if (selectedGame !== '전체') {
      list = list.filter(e => e.game === selectedGame)
    }
    // 정기 항상 표시, 기습은 지난 날짜 제거
    const today = new Date(); today.setHours(0,0,0,0)
    return list.filter(e => {
      if (e.event_type === 'regular_schedule') return true
      if (e.event_type === 'flash_event') {
        if (!e.event_date) return true
        const d = new Date(e.event_date); d.setHours(0,0,0,0)
        return d >= today
      }
      return true
    })
  }, [events, selectedGame])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white px-4 py-24">
      <div className="max-w-lg mx-auto">
        {/* 게임 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {games.map(game => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedGame === game
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-base">이벤트를 불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-gray-400">이벤트가 없습니다.</p>
              </div>
            ) : (
              filteredEvents.map(event => (
                <button
                  key={event.id}
                  className="w-full bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-gray-600/50 transition-all text-left active:scale-95"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">{event.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>{event.game}</span>
                        {event.multi_time && (<><span>•</span><span>{event.multi_time}</span></>)}
                        {event.event_date && (<><span>•</span><span>{new Date(event.event_date).toLocaleDateString('ko-KR')}</span></>)}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      event.event_type === 'regular_schedule' ? 'bg-blue-600/20 text-blue-400' : 'bg-orange-600/20 text-orange-400'
                    }`}>
                      {event.event_type === 'regular_schedule' ? '정기' : '기습'}
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
