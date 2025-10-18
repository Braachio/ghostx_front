'use client'

import { useEffect, useState, useCallback } from 'react'
import EventCard from './EventCard'
import { getDateFromWeekAndDay } from '@/app/utils/weekUtils'
import { MultiWithTemplate } from '@/types/events'

// 게임을 카테고리별로 그룹화
const gameCategories = {
  '시뮬레이션': {
    icon: '🏁',
    games: ['아이레이싱', '알펙터2', '아세토코르사', '그란투리스모7', '오토모빌리스타2']
  },
  'GT/스포츠카': {
    icon: '🏁',
    games: ['컴페티치오네', '르망얼티밋']
  },
  '포뮬러/오픈휠': {
    icon: '🏎️',
    games: ['F1 25']
  },
  '랠리/오프로드': {
    icon: '🌲',
    games: ['EA WRC']
  }
}

// 모든 게임 목록 추출
const allGames = Object.values(gameCategories).flatMap(category => category.games)

interface EventListPageProps {
  currentUserId: string | null
  eventTypeFilter?: string
}

export default function EventListPageSimple({ currentUserId, eventTypeFilter }: EventListPageProps) {
  const [multis, setMultis] = useState<MultiWithTemplate[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [loading, setLoading] = useState(true)
  const [isFilterExpanded, setIsFilterExpanded] = useState(true)

  // 필터 설정 키 생성 (사용자별로 구분)
  const getFilterKey = useCallback((key: string) => {
    const userId = currentUserId || 'anonymous'
    return `event_filter_${key}_${userId}`
  }, [currentUserId])

  // 필터 설정 로드
  const loadFilterSettings = useCallback(() => {
    try {
      // 게임 필터 로드
      const savedGames = localStorage.getItem(getFilterKey('selectedGames'))
      if (savedGames) {
        setSelectedGames(JSON.parse(savedGames))
      }


      // 시간 필터 로드
      const savedTimeFilter = localStorage.getItem(getFilterKey('timeFilter'))
      if (savedTimeFilter) {
        setTimeFilter(savedTimeFilter as 'upcoming' | 'past')
      }

      // 필터 확장 상태 로드
      const savedFilterExpanded = localStorage.getItem(getFilterKey('isFilterExpanded'))
      if (savedFilterExpanded) {
        setIsFilterExpanded(JSON.parse(savedFilterExpanded))
      }
    } catch (error) {
      console.error('필터 설정 로드 실패:', error)
    }
  }, [getFilterKey])

  // 필터 설정 저장
  const saveFilterSettings = useCallback(() => {
    try {
      localStorage.setItem(getFilterKey('selectedGames'), JSON.stringify(selectedGames))
      localStorage.setItem(getFilterKey('timeFilter'), timeFilter)
      localStorage.setItem(getFilterKey('isFilterExpanded'), JSON.stringify(isFilterExpanded))
    } catch (error) {
      console.error('필터 설정 저장 실패:', error)
    }
  }, [selectedGames, timeFilter, isFilterExpanded, getFilterKey])

  // 필터 초기화
  const resetFilterSettings = () => {
    try {
      setSelectedGames([])
      setTimeFilter('upcoming')
      setIsFilterExpanded(true)
      
      // localStorage에서도 삭제
      localStorage.removeItem(getFilterKey('selectedGames'))
      localStorage.removeItem(getFilterKey('timeFilter'))
      localStorage.removeItem(getFilterKey('isFilterExpanded'))
    } catch (error) {
      console.error('필터 설정 초기화 실패:', error)
    }
  }

  // 컴포넌트 마운트 시 필터 설정 로드
  useEffect(() => {
    loadFilterSettings()
  }, [loadFilterSettings])

  // 필터 설정이 변경될 때마다 저장
  useEffect(() => {
    if (selectedGames.length > 0 || timeFilter !== 'upcoming' || !isFilterExpanded) {
      saveFilterSettings()
    }
  }, [selectedGames, timeFilter, isFilterExpanded, saveFilterSettings])

  useEffect(() => {
    const fetchMultis = async () => {
      try {
        setLoading(true)
        console.log('이벤트 데이터 로드 시작...')
        
        const res = await fetch('/api/multis')
        console.log('API 응답 상태:', res.status, res.statusText)
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        
        const rawData: MultiWithTemplate[] = await res.json()
        console.log('로드된 이벤트 데이터:', rawData)
        
        // 새로운 필드들이 없을 경우 기본값 설정
        const data: MultiWithTemplate[] = rawData.map(item => ({
          ...item,
          event_type: item.event_type || 'flash_event', // null/undefined인 경우 flash_event로 설정
          is_template_based: item.is_template_based || false,
          template_id: item.template_id || null
        }))
        
        // 디버깅: event_type별로 데이터 확인
        const eventTypes = data.reduce((acc, item) => {
          acc[item.event_type] = (acc[item.event_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log('이벤트 타입별 개수:', eventTypes)
        
        if (data && data.length > 0) {
          console.log('실제 Supabase 데이터 로드 성공:', data.length, '개')
          console.log('첫 번째 이벤트 데이터:', data[0])
          setMultis(data)
        } else {
          console.log('Supabase에 데이터가 없음 - 빈 목록 표시')
          setMultis([])
        }
      } catch (error) {
        console.error('이벤트 데이터 로드 실패:', error)
        setMultis([])
      } finally {
        setLoading(false)
      }
    }

    fetchMultis()
  }, [])

  // 이벤트가 과거인지 미래인지 판단하는 함수
  const isEventPast = (multi: MultiWithTemplate) => {
    const now = new Date()
    // 로컬 시간 기준으로 오늘 날짜 계산
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    console.log('이벤트 날짜 계산 디버깅:', {
      multiId: multi.id,
      title: multi.title,
      year: multi.year,
      week: multi.week,
      multiDay: multi.multi_day,
      eventDate: multi.event_date,
      created_at: multi.created_at
    })
    
    // event_date가 있으면 해당 날짜 사용 (최우선)
    if (multi.event_date) {
      const eventDate = new Date(multi.event_date)
      eventDate.setHours(0, 0, 0, 0)
      const isPast = eventDate < today
      console.log('event_date 비교 결과:', {
        eventDate: eventDate.toISOString(),
        today: today.toISOString(),
        isPast
      })
      return isPast
    }
    
    // event_date가 없으면 주차 계산 사용
    if (multi.year && multi.week && multi.multi_day && multi.multi_day.length > 0) {
      // 간단한 주차 계산: 1월 1일부터 시작해서 주차 계산
      const jan1 = new Date(multi.year, 0, 1) // 1월 1일
      const jan1Day = jan1.getDay() // 0(일) ~ 6(토)
      
      // 1월 1일이 포함된 주의 월요일 찾기
      let daysFromMonday
      if (jan1Day === 0) {
        daysFromMonday = 6 // 일요일이면 6일 전이 월요일
      } else {
        daysFromMonday = jan1Day - 1 // 월요일(1)이면 0일 전
      }
      
      // 첫 번째 월요일
      const firstMonday = new Date(jan1)
      firstMonday.setDate(jan1.getDate() - daysFromMonday)
      
      // N주차의 월요일 = 1주차 월요일 + (N-1) * 7일
      const targetMonday = new Date(firstMonday)
      targetMonday.setDate(firstMonday.getDate() + (multi.week - 1) * 7)
      
      // 요일 매핑
      const dayMap: Record<string, number> = {
        '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6
      }
      
      const dayOffset = dayMap[multi.multi_day[0]]
      if (dayOffset !== undefined) {
        const eventDate = new Date(targetMonday)
        eventDate.setDate(targetMonday.getDate() + dayOffset)
        
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
        const isPast = eventDay < today
        
        console.log('간단한 주차 계산 결과:', {
          year: multi.year,
          week: multi.week,
          day: multi.multi_day[0],
          jan1: jan1.toISOString(),
          firstMonday: firstMonday.toISOString(),
          targetMonday: targetMonday.toISOString(),
          eventDate: eventDate.toISOString(),
          eventDay: eventDay.toISOString(),
          today: today.toISOString(),
          isPast
        })
        
        return isPast
      }
    }
    
    // 날짜 정보가 없으면 제목에서 날짜 추출 시도
    if (multi.title) {
      // 제목에서 날짜 패턴 찾기 (예: "10/10", "10/09", "10월 10일" 등)
      const datePatterns = [
        /(\d{1,2})\/(\d{1,2})/,  // MM/DD 형식
        /(\d{1,2})월\s*(\d{1,2})일/,  // MM월 DD일 형식
        /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD 형식
      ]
      
      for (const pattern of datePatterns) {
        const match = multi.title.match(pattern)
        if (match) {
          let month, day, year
          
          if (pattern.source.includes('월')) {
            // MM월 DD일 형식
            month = parseInt(match[1])
            day = parseInt(match[2])
            year = new Date().getFullYear()
          } else if (match.length === 4) {
            // YYYY-MM-DD 형식
            year = parseInt(match[1])
            month = parseInt(match[2])
            day = parseInt(match[3])
          } else {
            // MM/DD 형식
            month = parseInt(match[1])
            day = parseInt(match[2])
            year = new Date().getFullYear()
          }
          
          const eventDate = new Date(year, month - 1, day)
          const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
          const isPast = eventDay < today
          
          console.log('제목에서 날짜 추출 결과:', {
            title: multi.title,
            extractedDate: eventDate.toISOString(),
            eventDay: eventDay.toISOString(),
            today: today.toISOString(),
            isPast
          })
          
          return isPast
        }
      }
    }
    
    // 날짜 정보가 없으면 created_at 기준으로 판단
    if (multi.created_at) {
      const createdDate = new Date(multi.created_at)
      const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000))
      // 생성된지 7일 이상 지났으면 과거로 간주
      console.log('created_at 기준 판단:', {
        title: multi.title,
        createdDate: createdDate.toISOString(),
        daysDiff,
        isPast: daysDiff > 7
      })
      return daysDiff > 7
    }
    
    return false
  }

  // 필터링 및 정렬 (기습갤멀만)
  const filteredAndSorted = multis
    .filter(multi => {
      // 기습갤멀만 표시 (event_type이 flash_event이거나 null/undefined인 경우)
      if (multi.event_type !== 'flash_event' && multi.event_type !== null && multi.event_type !== undefined) {
        return false
      }
      
      // 게임 필터
      if (!selectedGames.includes(multi.game)) return false
      
      // 이벤트 타입 필터 (추가 필터링)
      if (eventTypeFilter && multi.event_type !== eventTypeFilter) return false
      
      // 시간 기반 필터 (활성/비활성 관계없이)
      const isPast = isEventPast(multi)
      
      switch (timeFilter) {
        case 'upcoming':
          return !isPast  // 과거가 아닌 모든 이벤트 (오늘 포함)
        case 'past':
          return isPast   // 과거 이벤트만
        default:
          return true
      }
    })
    .sort((a, b) => {
      // 날짜순 정렬 (고정)
      const aDate = a.event_date ? new Date(a.event_date) : 
                   (a.year && a.week && a.multi_day ? getDateFromWeekAndDay(a.year, a.week, a.multi_day[0]) : new Date(0))
      const bDate = b.event_date ? new Date(b.event_date) : 
                   (b.year && b.week && b.multi_day ? getDateFromWeekAndDay(b.year, b.week, b.multi_day[0]) : new Date(0))
      
      // 지난 이벤트는 최신순 (내림차순), 예정된 이벤트는 오름차순
      if (timeFilter === 'past') {
        return bDate.getTime() - aDate.getTime()  // 최신이 먼저
      } else {
        return aDate.getTime() - bDate.getTime()  // 가까운 날짜가 먼저
      }
    })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">이벤트 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
             <h1 className="text-3xl font-bold text-white mb-2">⚡ 기습 갤멀</h1>
            <p className="text-gray-400">
              {filteredAndSorted.length}개의 이벤트가 있습니다
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 빠른 필터 버튼들 */}
            <div className="flex items-center gap-2">
              <select
                value={timeFilter}
                onChange={(e) => {
                  e.stopPropagation()
                  setTimeFilter(e.target.value as 'upcoming' | 'past')
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="upcoming">🚀 예정된 이벤트</option>
                <option value="past">📜 지난 이벤트</option>
              </select>
              
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">🎮 게임 필터</h3>
              <span className="px-2 py-1 bg-blue-900/30 border border-blue-500/30 rounded text-xs text-blue-300">
                개인화됨
              </span>
            </div>
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="text-cyan-400 hover:text-cyan-300 text-sm"
            >
              {isFilterExpanded ? '접기' : '펼치기'}
            </button>
          </div>
          
          {isFilterExpanded && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {allGames.map(game => (
                  <button
                    key={game}
                    onClick={() => {
                      setSelectedGames(prev => 
                        prev.includes(game) 
                          ? prev.filter(g => g !== game)
                          : [...prev, game]
                      )
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedGames.includes(game)
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {game}
                  </button>
                ))}
              </div>
              
              {/* 필터 제어 버튼들 */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedGames(allGames)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={() => setSelectedGames([])}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                  >
                    전체 해제
                  </button>
                </div>
                <button
                  onClick={resetFilterSettings}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                >
                  🔄 초기화
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 이벤트 목록 */}
      {filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAndSorted.map(multi => (
            <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏁</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">이벤트가 없습니다</h3>
          <p className="text-gray-500">
            {timeFilter === 'upcoming' ? '예정된 이벤트가 없습니다' :
             timeFilter === 'past' ? '지난 이벤트가 없습니다' :
             '선택한 조건에 맞는 이벤트가 없습니다'}
          </p>
        </div>
      )}
    </div>
  )
}
