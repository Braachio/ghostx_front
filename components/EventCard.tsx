'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Multi = Database['public']['Tables']['multis']['Row']

interface EventCardProps {
  multi: Multi
  currentUserId: string | null
}

export default function EventCard({ multi, currentUserId }: EventCardProps) {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(multi.is_open)
  const [isLoading, setIsLoading] = useState(false)

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
      '알펙터2': '🏁'
    }
    return gameIcons[game] || '🏁'
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 요일별 색상 매핑
  const getDayColor = (day: string) => {
    const dayColors: Record<string, string> = {
      '월': 'text-blue-400 bg-blue-500/20',
      '화': 'text-green-400 bg-green-500/20',
      '수': 'text-purple-400 bg-purple-500/20',
      '목': 'text-orange-400 bg-orange-500/20',
      '금': 'text-pink-400 bg-pink-500/20',
      '토': 'text-cyan-400 bg-cyan-500/20',
      '일': 'text-red-400 bg-red-500/20'
    }
    return dayColors[day] || 'text-gray-400 bg-gray-500/20'
  }

  // 특정 연도, 주차, 요일로 정확한 날짜 계산
  const getDateFromWeekAndDay = (year: number, week: number, dayName: string) => {
    const dayMap: Record<string, number> = {
      '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0
    }
    
    const dayNum = dayMap[dayName]
    if (dayNum === undefined) return null
    
    // 해당 연도의 1월 1일
    const jan1 = new Date(year, 0, 1)
    
    // 1월 1일이 무슨 요일인지 확인
    const jan1Day = jan1.getDay()
    
    // 첫 번째 주의 월요일 찾기 (ISO 8601 주 표준)
    const firstMonday = new Date(jan1)
    const daysToMonday = jan1Day === 0 ? 1 : 8 - jan1Day // 일요일이면 +1, 아니면 다음 월요일까지
    firstMonday.setDate(jan1.getDate() + daysToMonday)
    
    // 해당 주차의 해당 요일 계산
    const targetDate = new Date(firstMonday)
    targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + dayNum)
    
    return targetDate
  }

  // 이벤트 날짜 계산 (지난 이벤트와 미래 이벤트 구분)
  const getEventDates = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // multi의 week와 year 정보를 활용
    const multiYear = multi.year
    const multiWeek = multi.week
    
    // multi_week나 multi_year가 null이거나 undefined인 경우 처리
    if (!multiWeek || !multiYear) {
      return { pastDates: [], futureDates: [] }
    }
    
    const pastDates: Date[] = []
    const futureDates: Date[] = []
    
    for (const day of multi.multi_day) {
      const eventDate = getDateFromWeekAndDay(multiYear, multiWeek, day)
      
      if (eventDate) {
        if (eventDate < today) {
          pastDates.push(eventDate)
        } else {
          futureDates.push(eventDate)
        }
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

  const handleCardClick = (e: React.MouseEvent) => {
    // 버튼이나 링크 클릭 시에는 카드 클릭 이벤트를 방지
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    
    // 카드 클릭 시 상세 페이지로 이동
    router.push(`/multis/${multi.id}`)
  }

  const handleKeyOpen: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(`/multis/${multi.id}`)
    }
  }

  const nextEventDate = getNextEventDate()
  const formatKoreanDate = (d: Date | null) => {
    if (!d) return null
    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
    const dayName = dayNames[d.getDay()]
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dayName})`
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
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTimeLabel().color}`}>
                {getTimeLabel().label}
              </span>
            </div>
          </div>
        </div>
        
        {currentUserId && multi.author_id === currentUserId ? (
          <button
            onClick={toggleOpen}
            disabled={isLoading}
            title="운영자 전용: 활성/비활성 전환"
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isOpen
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/25'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isOpen ? '✅ 활성' : '❌ 비활성'}
          </button>
        ) : (
          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
            isOpen ? 'bg-green-600/20 text-green-300 border border-green-500/30' : 'bg-gray-700 text-gray-300 border border-gray-600'
          }`}>
            {isOpen ? '활성' : '비활성'}
          </div>
        )}
      </div>

      {/* 이벤트 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">🏁</span>
            <span className="text-gray-300">트랙:</span>
            <span className="text-white font-medium">{multi.game_track}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🚗</span>
            <span className="text-gray-300">클래스:</span>
            <span className="text-white font-medium">{multi.multi_class}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">📅</span>
            <span className="text-gray-300">요일:</span>
            <div className="flex flex-wrap gap-1">
              {multi.multi_day.map(day => (
                <span key={day} className={`px-2 py-1 rounded-full text-xs font-medium ${getDayColor(day)}`}>
                  {day}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">⏰</span>
            <span className="text-gray-300">시간:</span>
            <span className="text-white font-medium">{multi.multi_time || '미정'}</span>
          </div>
        </div>
      </div>

      {/* 설명 */}
      {truncatedDescription && (
        <div className="mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">{truncatedDescription}</p>
        </div>
      )}

      {/* 다음 일정 안내 */}
      {nextEventDate && (
        <div className="mb-4 -mt-2 text-xs text-gray-400 flex items-center gap-2">
          <span className="text-cyan-400">🗓</span>
          <span>다음 일정: {formatKoreanDate(nextEventDate)}</span>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>📅</span>
          <span>{formatDate(multi.created_at || '')}</span>
        </div>
        
        <div className="flex gap-3">
          {multi.link ? (
            <a
              href={multi.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              🔗 참가하기
            </a>
          ) : (
            <Link href={`/multis/${multi.id}`}>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                💬 상세보기
              </button>
            </Link>
          )}
          
          {/* 작성자에게만 수정 버튼 표시 */}
          {currentUserId && multi.author_id === currentUserId && (
            <Link href={`/multis/${multi.id}/edit`}>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                ✏️ 수정
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
