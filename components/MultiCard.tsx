'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { useEventToggle } from '@/hooks/useEventToggle'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MultiCard({
  multi,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId,
}: {
  multi: Multi
  currentUserId: string | null
}) {
  const [isOpen, setIsOpen] = useState(multi.is_open)
  
  // 이벤트 토글 훅 사용
  const { toggleEvent, isLoading } = useEventToggle({
    eventId: multi.id,
    eventTitle: multi.title,
    eventGame: multi.game,
    eventType: multi.event_type === 'regular_schedule' ? 'regular_schedule' : 'flash_event',
    onToggle: setIsOpen
  })

  // 이벤트 시작 날짜 계산 (event_date만 사용)
  const getEventDate = () => {
    if (multi.event_date) {
      const eventDate = new Date(multi.event_date + 'T12:00:00') // 정오로 설정해서 시간대 문제 방지
      console.log('MultiCard 날짜 표시:', {
        title: multi.title,
        event_date: multi.event_date,
        parsed: eventDate.toDateString()
      })
      return eventDate
    }
    
    console.log('event_date 없음:', multi.title)
    return null
  }

  const eventDate = getEventDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const isToday = eventDate && eventDate.toDateString() === today.toDateString()
  const isTomorrow = eventDate && eventDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString()
  const isPast = eventDate && eventDate < today

  const handleToggle = () => {
    toggleEvent(isOpen)
  }

  return (
    <div
      className={`border-2 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
        ${isOpen ? 'border-green-400 bg-gradient-to-br from-green-900/20 to-black shadow-green-500/20' : 'border-gray-600'}
        bg-gradient-to-br from-gray-800 to-black text-white
        p-3 sm:p-4 min-h-[130px] sm:min-h-[140px] group`}
    >
      {/* 이벤트 시작 날짜 (가장 눈에 띄게) */}
      {eventDate && (
        <div className={`mb-3 px-3 py-1 rounded-lg text-center text-sm font-bold
          ${isPast ? 'bg-gray-500 text-white' :
            isToday ? 'bg-red-500 text-white' : 
            isTomorrow ? 'bg-orange-500 text-white' : 
            'bg-blue-500 text-white'}`}>
          {isPast ? '📅 종료됨' :
           isToday ? '🔥 오늘' : 
           isTomorrow ? '⚡ 내일' : 
           `${eventDate.getMonth() + 1}/${eventDate.getDate()} ${['일', '월', '화', '수', '목', '금', '토'][eventDate.getDay()]}`}
        </div>
      )}

      {/* 제목 */}
      {multi.link ? (
        <a
          href={multi.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base sm:text-lg font-semibold hover:text-cyan-400 transition-colors mb-2 block truncate"
        >
          🏁 {multi.title}
        </a>
      ) : (
        <Link href={`/multis/${multi.id}`}>
          <h2 className="text-base sm:text-lg font-semibold hover:text-cyan-400 transition-colors mb-2 truncate">
            🏁 {multi.title}
          </h2>
        </Link>
      )}

      {/* 오픈 시간 + ON/OFF 버튼 */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm text-gray-300">
          <strong className="text-cyan-400">⏰ 오픈:</strong> {multi.multi_time || '미입력'}
        </p>

        <button
          onClick={handleToggle}
          disabled={isLoading || isPast}
          className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ml-2 transition-all duration-200 font-semibold
            ${isPast 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : isOpen
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/25'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
          {isPast ? '🔒 종료' : isOpen ? '✅ ON' : '❌ OFF'}
        </button>
      </div>

      {/* 기타 정보 */}
      <div className="space-y-1">
        <p className="text-xs sm:text-sm text-gray-300">
          <strong className="text-blue-400">🏁 트랙:</strong> {multi.game_track}
        </p>
        {/* <p className="text-xs sm:text-sm">
          <strong>레이스:</strong> {multi.multi_race}
        </p> */}
        <p className="text-xs sm:text-sm text-gray-300">
          <strong className="text-purple-400">🚗 클래스:</strong> {multi.multi_class}
        </p>
      </div>
    </div>
  )
}
