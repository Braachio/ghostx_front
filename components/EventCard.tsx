'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { useRouter } from 'next/navigation'
import { MultiWithTemplate } from '@/types/events'

interface EventCardProps {
  multi: MultiWithTemplate
  currentUserId: string | null
}

export default function EventCard({ multi, currentUserId }: EventCardProps) {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(multi.is_open)
  const [isLoading, setIsLoading] = useState(false)

  // 이벤트 시작 날짜 계산 (event_date만 사용)
  const getEventDate = () => {
    if (multi.event_date) {
      const eventDate = new Date(multi.event_date + 'T12:00:00') // 정오로 설정해서 시간대 문제 방지
      console.log('EventCard 날짜 표시:', {
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
  
  const isPast = eventDate && eventDate < today

  // 날짜/시간 정보 포맷팅 함수
  const getDateTimeInfo = () => {
    if (!eventDate) {
      if (multi.event_type === 'regular_schedule') {
        return `매주 ${multi.multi_day && multi.multi_day[0]}요일${multi.multi_time ? ` ${multi.multi_time}` : ''}`
      }
      return '날짜 미정'
    }

    if (multi.event_type === 'regular_schedule') {
      return `매주 ${multi.multi_day && multi.multi_day[0]}요일${multi.multi_time ? ` ${multi.multi_time}` : ''}`
    } else {
      return `${eventDate.getMonth() + 1}월 ${eventDate.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][eventDate.getDay()]}요일${multi.multi_time ? ` ${multi.multi_time}` : ''}`
    }
  }

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

  // 게임별 아이콘 매핑
  const getGameIcon = (game: string) => {
    const gameIcons: Record<string, string> = {
      '컴페티치오네': '🏁',
      '아세토코르사': '🏎️',
      '그란투리스모7': '🏆',
      '르망얼티밋': '🏁',
      'EA WRC': '🌲',
      '아이레이싱': '🏁',
      '알펙터2': '🏁',
      'F1 25': '🏎️',
      '오토모빌리스타2': '🏁'
    }
    return gameIcons[game] || '🏁'
  }




  // 이벤트 날짜 계산 (event_date만 사용)
  const getEventDates = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const pastDates: Date[] = []
    const futureDates: Date[] = []
    
    // event_date만 사용
    if (multi.event_date) {
      const eventDate = new Date(multi.event_date + 'T12:00:00') // 정오로 설정해서 시간대 문제 방지
      eventDate.setHours(0, 0, 0, 0) // 시간 제거하고 날짜만 비교
      
      if (eventDate < today) {
        pastDates.push(eventDate)
      } else {
        futureDates.push(eventDate)
      }
    }
    
    return { pastDates, futureDates }
  }

  // 다음 이벤트 날짜 계산 (미래 날짜만)
  const getNextEventDate = () => {
    const { futureDates } = getEventDates()
    
    if (futureDates.length === 0) {
      return null
    }
    
    // 가장 가까운 미래 날짜 반환
    return futureDates.reduce((closest, current) => 
      current < closest ? current : closest
    )
  }


  // 시간대 라벨 생성 (지난 이벤트와 미래 이벤트 구분)
  const getTimeLabel = () => {
    const { pastDates, futureDates } = getEventDates()
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // 미래 이벤트가 있으면 미래 이벤트 기준으로 라벨 생성
    if (futureDates.length > 0) {
      const nextEventDate = futureDates.reduce((closest, current) => 
        current < closest ? current : closest
      )
      
      const diffDays = Math.ceil((nextEventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        return { label: '🔥 오늘', color: 'text-red-400 bg-red-500/20' }
      } else if (diffDays === 1) {
        return { label: '⚡ 내일', color: 'text-orange-400 bg-orange-500/20' }
      } else if (diffDays <= 7) {
        return { label: `${diffDays}일 후`, color: 'text-yellow-400 bg-yellow-500/20' }
      } else if (diffDays <= 14) {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토']
        const dayName = dayNames[nextEventDate.getDay()]
        return { label: `다음주 ${dayName}`, color: 'text-blue-400 bg-blue-500/20' }
      } else {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토']
        const dayName = dayNames[nextEventDate.getDay()]
        const weeksDiff = Math.ceil(diffDays / 7)
        return { label: `${weeksDiff}주 후 ${dayName}`, color: 'text-purple-400 bg-purple-500/20' }
      }
    }
    
    // 지난 이벤트만 있는 경우
    if (pastDates.length > 0) {
      const lastEventDate = pastDates.reduce((latest, current) => 
        current > latest ? current : latest
      )
      
      const diffDays = Math.ceil((today.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 7) {
        return { label: `${diffDays}일 전`, color: 'text-gray-400 bg-gray-500/20' }
      } else {
        const dayNames = ['일', '월', '화', '수', '목', '금', '토']
        const dayName = dayNames[lastEventDate.getDay()]
        const weeksDiff = Math.ceil(diffDays / 7)
        return { label: `${weeksDiff}주 전 ${dayName}`, color: 'text-gray-500 bg-gray-600/20' }
      }
    }
    
    // 날짜 정보가 없는 경우
    return { label: '날짜 미정', color: 'text-gray-400 bg-gray-500/20' }
  }

  // 게임 이름을 URL용으로 변환
  const getGameSlug = (gameName: string) => {
    const gameSlugs: Record<string, string> = {
      '아이레이싱': 'iracing',
      '아세토코르사': 'assettocorsa',
      '그란투리스모7': 'gran-turismo7',
      '오토모빌리스타2': 'automobilista2',
      '컴페티치오네': 'competizione',
      '르망얼티밋': 'lemans',
      'F1 25': 'f1-25',
      'EA WRC': 'ea-wrc'
    }
    return gameSlugs[gameName] || gameName.toLowerCase().replace(/\s+/g, '-')
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // 버튼이나 링크 클릭 시에는 카드 클릭 이벤트를 방지
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    
    // 정기 이벤트인 경우 정기 이벤트 상세 페이지로, 그 외는 일반 상세 페이지로
    if (multi.event_type === 'regular_schedule') {
      const gameSlug = getGameSlug(multi.game)
      router.push(`/events/regular/${gameSlug}/${multi.id}`)
    } else {
      router.push(`/multis/${multi.id}`)
    }
  }

  const handleKeyOpen: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/multis/${multi.id}`)
    }
  }


  const truncatedDescription = multi.description && multi.description.length > 140
    ? `${multi.description.slice(0, 140)}…`
    : multi.description

  return (
    <div 
      onClick={handleCardClick}
      onKeyDown={handleKeyOpen}
      role="button"
      tabIndex={0}
      aria-label={`${multi.title} 상세 보기`}
      className={`group relative bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 ${isOpen ? '' : 'opacity-70'}
      `}
    >

      {/* 정기 이벤트 표시 */}
      {multi.event_type === 'regular_schedule' && (
        <div className="mb-4 px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full text-center border border-green-500/30">
          🔄 매주 반복
        </div>
      )}

      {/* 헤더 - 게임 아이콘, 제목, 상태 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getGameIcon(multi.game)}</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              {multi.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-400">{multi.game}</p>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-300">{getDateTimeInfo()}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeLabel().color}`}>
                {getTimeLabel().label}
              </span>
            </div>
          </div>
        </div>
        
        {currentUserId && multi.author_id === currentUserId ? (
          <button
            onClick={toggleOpen}
            disabled={isLoading || isPast}
            title={isPast ? "종료된 이벤트는 상태 변경 불가" : "운영자 전용: 활성/비활성 전환"}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isPast
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isOpen
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/25'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isPast ? '🔒 종료' : isOpen ? '✅ ON' : '❌ OFF'}
          </button>
        ) : (
          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
            isOpen ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-300 border border-gray-600'
          }`}>
            {isOpen ? 'ON' : 'OFF'}
          </div>
        )}
      </div>

      {/* 이벤트 정보 - 더 디테일하게 */}
      <div className="mb-6 space-y-4">
        {/* 레이스 타입 (눈에 띄게) */}
        {multi.multi_race && (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg py-3 px-4">
            <span className="text-purple-400 text-lg">🏆</span>
            <span className="text-gray-300 text-sm">레이스:</span>
            <span className="text-white font-bold text-lg">{multi.multi_race}</span>
          </div>
        )}

        {/* 상세 정보 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">🏁</span>
            <span className="text-gray-400 text-sm">트랙:</span>
            <span className="text-white font-medium text-sm">{multi.game_track}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🚗</span>
            <span className="text-gray-400 text-sm">클래스:</span>
            <span className="text-white font-medium text-sm">{multi.multi_class}</span>
          </div>
        </div>
      </div>

      {/* 설명 */}
      {truncatedDescription && (
        <div className="mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">{truncatedDescription}</p>
        </div>
      )}



    </div>
  )
}
