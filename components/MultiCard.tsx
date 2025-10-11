'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { getDateFromWeekAndDay } from '@/app/utils/weekUtils'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MultiCard({
  multi,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUserId,
}: {
  multi: Multi
  currentUserId: string | null
}) {
  const supabase = createClientComponentClient<Database>()
  const [isOpen, setIsOpen] = useState(multi.is_open)
  const [isLoading, setIsLoading] = useState(false)

  // 이벤트 시작 날짜 계산
  const getEventDate = () => {
    if (multi.event_date) {
      return new Date(multi.event_date)
    }
    
    if (multi.year && multi.week && multi.multi_day && multi.multi_day.length > 0) {
      // 첫 번째 요일을 기준으로 날짜 계산
      return getDateFromWeekAndDay(multi.year, multi.week, multi.multi_day[0])
    }
    
    return null
  }

  const eventDate = getEventDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const isToday = eventDate && eventDate.toDateString() === today.toDateString()
  const isTomorrow = eventDate && eventDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString()
  const isPast = eventDate && eventDate < today

  const toggleOpen = async () => {
    if (isLoading) return

    setIsLoading(true)

    const { error } = await supabase
      .from('multis')
      .update({ is_open: !isOpen } as Database['public']['Tables']['multis']['Update'])
      .eq('id', multi.id)

    if (!error) setIsOpen(!isOpen)
    else alert(`상태 변경 실패: ${error.message}`)

    setIsLoading(false)
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
          onClick={toggleOpen}
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
