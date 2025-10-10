'use client'

import { useEffect, useState } from 'react'
import EventCard from './EventCard'
import type { Database } from '@/lib/database.types'

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

type Multi = Database['public']['Tables']['multis']['Row']

interface EventListPageProps {
  currentUserId: string | null
}

export default function EventListPage({ currentUserId }: EventListPageProps) {
  const [multis, setMultis] = useState<Multi[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>(allGames)
  const [sortBy, setSortBy] = useState<'date' | 'game' | 'title'>('date')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'>('all')
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

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
        
        const data: Multi[] = await res.json()
        console.log('로드된 이벤트 데이터:', data)
        
        if (data && data.length > 0) {
          console.log('실제 Supabase 데이터 로드 성공:', data.length, '개')
          console.log('첫 번째 이벤트 데이터:', data[0])
          setMultis(data)
        } else {
          // 데이터가 없을 때는 빈 배열로 설정
          console.log('Supabase에 데이터가 없음 - 빈 목록 표시')
          setMultis([])
        }
      } catch (error) {
        console.error('이벤트 데이터 로드 실패:', error)
        // 에러 시에도 더미 데이터 표시
        const dummyData: Multi[] = [
          {
            id: '1',
            title: '🏁 주말 레이싱 이벤트',
            game: '컴페티치오네',
            game_track: 'Seoul Circuit',
            multi_class: 'GT3',
            multi_day: ['토', '일'],
            multi_time: '20:00',
            multi_race: 'Sprint Race',
            is_open: true,
            description: '주말 레이싱 이벤트입니다. 많은 참여 부탁드립니다!',
            link: null,
            author_id: 'dummy-author',
            anonymous_nickname: null,
            anonymous_password: null,
            created_at: new Date().toISOString(),
            updated_at: null,
            year: new Date().getFullYear(),
            week: Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))
          }
        ]
        setMultis(dummyData)
      } finally {
        setLoading(false)
        console.log('로딩 완료')
      }
    }
    fetchMultis()
  }, [])

  const toggleGameSelection = (game: string) => {
    setSelectedGames(prev =>
      prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]
    )
  }

  // 전체 선택/해제 함수
  const selectAllGames = () => {
    setSelectedGames(allGames)
  }

  const deselectAllGames = () => {
    setSelectedGames([])
  }




  // 시간대별 그룹핑 함수 (지난 이벤트와 미래 이벤트 구분)
  const getTimeGroup = (multi: Multi) => {
    const { pastDates, futureDates } = getEventDates(multi)
    
    // 미래 이벤트가 있으면 미래 이벤트 기준으로 그룹핑
    if (futureDates.length > 0) {
      const nextEventDate = futureDates.reduce((closest, current) => 
        current < closest ? current : closest
      )
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffDays = Math.ceil((nextEventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`${multi.title} 미래 이벤트 그룹핑:`, {
        eventDate: nextEventDate.toDateString(),
        today: today.toDateString(),
        diffDays,
        group: diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : diffDays <= 7 ? 'thisWeek' : 'future'
      })
      
      if (diffDays === 0) return 'today'
      if (diffDays === 1) return 'tomorrow'
      if (diffDays <= 7) return 'thisWeek'
      return 'future'
    }
    
    // 지난 이벤트만 있는 경우
    if (pastDates.length > 0) {
      const lastEventDate = pastDates.reduce((latest, current) => 
        current > latest ? current : latest
      )
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffDays = Math.ceil((today.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`${multi.title} 지난 이벤트 그룹핑:`, {
        eventDate: lastEventDate.toDateString(),
        today: today.toDateString(),
        diffDays,
        group: diffDays <= 7 ? 'recentPast' : 'past'
      })
      
      if (diffDays <= 7) return 'recentPast'
      return 'past'
    }
    
    // 날짜 정보가 없는 경우
    return 'unknown'
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

  // 이벤트 날짜 계산 (연도, 주차, 요일로 정확한 날짜 계산)
  const getEventDates = (multi: Multi) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // multi의 week와 year 정보를 활용
    const multiYear = multi.year
    const multiWeek = multi.week
    
    console.log(`이벤트 ${multi.title}:`, {
      multiYear,
      multiWeek,
      multiDay: multi.multi_day
    })
    
    // multi_week나 multi_year가 null이거나 undefined인 경우 처리
    if (!multiWeek || !multiYear) {
      console.log('주차 또는 연도 정보가 없음:', multi.title)
      return { pastDates: [], futureDates: [], allDates: [] }
    }
    
    const pastDates: Date[] = []
    const futureDates: Date[] = []
    const allDates: Date[] = []
    
    for (const day of multi.multi_day) {
      const eventDate = getDateFromWeekAndDay(multiYear, multiWeek, day)
      
      if (eventDate) {
        allDates.push(eventDate)
        
        console.log(`${multi.title} - ${day}:`, {
          eventDate: eventDate.toDateString(),
          today: today.toDateString(),
          isPast: eventDate < today,
          isFuture: eventDate >= today
        })
        
        if (eventDate < today) {
          pastDates.push(eventDate)
        } else {
          futureDates.push(eventDate)
        }
      }
    }
    
    return { pastDates, futureDates, allDates }
  }

  // 다음 이벤트 날짜 계산 (미래 날짜만)
  const getNextEventDate = (multi: Multi) => {
    const { futureDates } = getEventDates(multi)
    
    if (futureDates.length === 0) {
      console.log(`미래 이벤트 없음: ${multi.title}`)
      return null
    }
    
    // 가장 가까운 미래 날짜 반환
    const closestFutureDate = futureDates.reduce((closest, current) => 
      current < closest ? current : closest
    )
    
    console.log(`가장 가까운 미래 이벤트: ${multi.title} - ${closestFutureDate.toDateString()}`)
    return closestFutureDate
  }


  // 필터링 및 정렬
  const filteredAndSorted = multis
    .filter(multi => {
      if (!showInactive && !multi.is_open) return false
      if (!selectedGames.includes(multi.game)) return false
      
      if (timeFilter === 'all') return true
      
      const timeGroup = getTimeGroup(multi)
      const today = new Date()
      
      switch (timeFilter) {
        case 'today':
          return timeGroup === 'today'
        case 'tomorrow':
          return timeGroup === 'tomorrow'
        case 'thisWeek':
          return timeGroup === 'today' || timeGroup === 'tomorrow' || timeGroup === 'thisWeek'
        case 'nextWeek':
          // 다음주는 future 그룹에서 8-14일 차이인 것들
          if (timeGroup === 'future') {
            const { futureDates } = getEventDates(multi)
            if (futureDates.length > 0) {
              const nextEventDate = futureDates.reduce((closest, current) => 
                current < closest ? current : closest
              )
              const diffDays = Math.ceil((nextEventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              return diffDays >= 8 && diffDays <= 14
            }
          }
          return false
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const aDate = getNextEventDate(a)
          const bDate = getNextEventDate(b)
          if (!aDate || !bDate) return 0
          return aDate.getTime() - bDate.getTime()
        case 'game':
          return a.game.localeCompare(b.game)
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">👻 이벤트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white space-y-8">
      {/* 필터 및 정렬 - 접을 수 있는 간단한 버전 */}
      <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* 필터 헤더 (항상 표시) */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔍</span>
            <h3 className="text-lg font-bold text-white">필터</h3>
            <span className="text-sm text-gray-400">
              ({selectedGames.length}개 게임 선택)
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* 빠른 필터 버튼들 */}
            <div className="flex items-center gap-2">
              <select
                value={timeFilter}
                onChange={(e) => {
                  e.stopPropagation()
                  setTimeFilter(e.target.value as 'all' | 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek')
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">📅 전체</option>
                <option value="today">🔥 오늘</option>
                <option value="tomorrow">⚡ 내일</option>
                <option value="thisWeek">📅 이번주</option>
                <option value="nextWeek">📆 다음주</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => {
                  e.stopPropagation()
                  setSortBy(e.target.value as 'date' | 'game' | 'title')
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="date">⏰ 시간순</option>
                <option value="game">🎮 게임순</option>
                <option value="title">📝 제목순</option>
              </select>
            </div>
            
            <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
              <span className={`transform transition-transform inline-block ${isFilterExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* 확장된 필터 옵션 */}
        {isFilterExpanded && (
          <div className="p-6 pt-0 border-t border-gray-700">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* 게임 선택 - 간단한 버전 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-300">🎮 게임</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllGames}
                      className="px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors"
                    >
                      전체
                    </button>
                    <button
                      onClick={deselectAllGames}
                      className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                    >
                      해제
                    </button>
                  </div>
                </div>
                
                {/* 게임 버튼들 - 카테고리 없이 */}
                <div className="flex flex-wrap gap-2">
                  {allGames.map(game => (
                    <button
                      key={game}
                      onClick={() => toggleGameSelection(game)}
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
              </div>

              {/* 기타 옵션 */}
              <div className="lg:w-48">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">🧹 표시 옵션</h4>
                <label className="inline-flex items-center gap-2 text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  <span className="text-sm">비활성 이벤트 포함</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🏁</div>
            <div className="text-2xl font-bold text-blue-400">{filteredAndSorted.length}</div>
            <div className="text-gray-300 text-sm">전체 이벤트</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-400">
              {filteredAndSorted.filter(m => m.is_open).length}
            </div>
            <div className="text-gray-300 text-sm">활성 이벤트</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
          <div className="text-center">
            <div className="text-3xl mb-2">🎮</div>
            <div className="text-2xl font-bold text-purple-400">{selectedGames.length}</div>
            <div className="text-gray-300 text-sm">선택된 게임</div>
          </div>
        </div>
      </div>

      {/* 이벤트 목록 */}
      {filteredAndSorted.length > 0 ? (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">🏁 레이싱 이벤트</h2>
          
          {/* 시간대별 그룹핑 */}
          {timeFilter === 'all' ? (
            <div className="space-y-8">
              {/* 오늘 */}
              {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'today').length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-red-400">🔥 오늘</h3>
                    <span className="text-sm text-gray-400">
                      {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'today').length}개 이벤트
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAndSorted
                      .filter(multi => getTimeGroup(multi) === 'today')
                      .map(multi => (
                        <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
                      ))}
                  </div>
                </div>
              )}

              {/* 내일 */}
              {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'tomorrow').length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-orange-400">⚡ 내일</h3>
                    <span className="text-sm text-gray-400">
                      {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'tomorrow').length}개 이벤트
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAndSorted
                      .filter(multi => getTimeGroup(multi) === 'tomorrow')
                      .map(multi => (
                        <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
                      ))}
                  </div>
                </div>
              )}

              {/* 이번주 */}
              {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'thisWeek').length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-yellow-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-yellow-400">📅 이번주</h3>
                    <span className="text-sm text-gray-400">
                      {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'thisWeek').length}개 이벤트
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAndSorted
                      .filter(multi => getTimeGroup(multi) === 'thisWeek')
                      .map(multi => (
                        <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
                      ))}
                  </div>
                </div>
              )}

              {/* 더 먼 미래 */}
              {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'future').length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-purple-400">📆 더 먼 미래</h3>
                    <span className="text-sm text-gray-400">
                      {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'future').length}개 이벤트
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAndSorted
                      .filter(multi => getTimeGroup(multi) === 'future')
                      .map(multi => (
                        <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
                      ))}
                  </div>
                </div>
              )}

              {/* 최근 지난 이벤트 */}
              {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'recentPast').length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-400">⏰ 최근 지난 이벤트</h3>
                    <span className="text-sm text-gray-400">
                      {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'recentPast').length}개 이벤트
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAndSorted
                      .filter(multi => getTimeGroup(multi) === 'recentPast')
                      .map(multi => (
                        <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
                      ))}
                  </div>
                </div>
              )}

              {/* 지난 이벤트 */}
              {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'past').length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gray-600 rounded-full"></div>
                    <h3 className="text-xl font-bold text-gray-500">📜 지난 이벤트</h3>
                    <span className="text-sm text-gray-400">
                      {filteredAndSorted.filter(multi => getTimeGroup(multi) === 'past').length}개 이벤트
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredAndSorted
                      .filter(multi => getTimeGroup(multi) === 'past')
                      .map(multi => (
                        <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAndSorted.map(multi => (
                <EventCard key={multi.id} multi={multi} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/10">
          <div className="text-6xl mb-4">👻</div>
          <p className="text-gray-300 text-lg mb-2">
            선택한 게임에 해당하는 이벤트가 없습니다.
          </p>
          <p className="text-gray-400 text-sm">
            다른 게임을 선택하거나 새로운 이벤트를 등록해보세요!
          </p>
        </div>
      )}
    </div>
  )
}
