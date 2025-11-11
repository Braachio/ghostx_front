// ✅ 다크모드 + 이번주 디폴트 적용된 전체 코드
'use client'

import { useEffect, useState } from 'react'
import MultiCard from './MultiCard'
import type { Database } from '@/lib/database.types'
import { getWeekDateRange, getCurrentWeekInfo } from '@/app/utils/weekUtils'
import WeekFilter from './WeekFilter'
import { MultiWithTemplate } from '@/types/events'

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일']
const allGames = ['컴페티치오네', '아세토코르사', '그란투리스모7', '르망얼티밋','EA WRC', '아이레이싱', '알펙터2']

type Multi = Database['public']['Tables']['multis']['Row']

type MultiListPageProps = {
  currentUserId: string | null
  eventTypeFilter?: string
}

export default function MultiListPage({ currentUserId, eventTypeFilter }: MultiListPageProps) {
  const [multis, setMultis] = useState<MultiWithTemplate[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>(allGames)

  const current = getCurrentWeekInfo()
  const [year, setYear] = useState(current.year)
  const [week, setWeek] = useState(current.week)

  const today = new Date()
  const todayKoreanWeekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(today)

  useEffect(() => {
    const fetchMultis = async () => {
      const res = await fetch('/api/multis')
      const data: Multi[] = await res.json()
      setMultis(data)
    }
    fetchMultis()
  }, [])

  const toggleGameSelection = (game: string) => {
    setSelectedGames(prev =>
      prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]
    )
  }

  const filtered = multis.filter(multi => {
    const matchesGames = selectedGames.includes(multi.game)
    const matchesWeek = multi.year === year && multi.week === week
    const matchesEventType = !eventTypeFilter || multi.event_type === eventTypeFilter
    
    return matchesGames && matchesWeek && matchesEventType
  })

  const groupedByGame = filtered.reduce<Record<string, Multi[]>>((acc, multi) => {
    if (!acc[multi.game]) acc[multi.game] = []
    acc[multi.game].push(multi)
    return acc
  }, {})

  const { start } = getWeekDateRange(year, week)
  const startDate = start

  return (
    <div className="text-white">
      {/* 필터 */}
      <div className="mb-6 border-2 border-cyan-500/30 p-6 rounded-xl bg-gradient-to-br from-gray-900 to-black shadow-2xl shadow-cyan-500/10">
        <h2 className="text-xl font-bold mb-4 text-white">🎮 고스트카 게임 필터</h2>
        <div className="flex flex-wrap gap-4 ml-4 items-center">
          {allGames.map(game => (
            <label key={game} className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedGames.includes(game)}
                onChange={() => toggleGameSelection(game)}
                className="w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">{game}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <WeekFilter
          year={year}
          week={week}
          setYear={setYear}
          setWeek={setWeek}
          minWeek={current.week - 1}
          maxWeek={current.week + 2}
        />
      </div>

      {/* 게임 별 요일 가능 공지 */}
      {Object.entries(groupedByGame).map(([game, gameMultis]) => (
        <div
          key={game}
          className="mb-10 border-2 border-blue-500/30 rounded-xl p-6 bg-gradient-to-br from-gray-900 to-black shadow-2xl shadow-blue-500/10"
        >
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{game}</h2>
          {/* 반응형 그리드: 모바일 1열, 태블릿 2열, PC는 7열 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {daysOfWeek.map((day, i) => {
              const isToday = day === todayKoreanWeekday
              const dateObj = new Date(startDate)
              dateObj.setDate(startDate.getDate() + i)
              const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
              return (
                <div
                  key={day}
                  className="min-w-0 sm:min-w-[150px] flex flex-col"
                >
                  {/* 요일 헤더 */}
                  <div
                    className={`text-center text-sm font-semibold border-b border-gray-600 pb-2 mb-3
                      ${isToday ? 'border-none bg-cyan-900 text-cyan-300 rounded-lg' : 'text-gray-300'}
                      ${day === '일' ? 'text-red-400' : day === '토' ? 'text-blue-400' : ''}`}
                  >
                    {day} ({dateStr})
                  </div>
                  {/* 공지 카드 리스트 */}
                  <div className="space-y-3">
                    {gameMultis.filter(m => m.multi_day.includes(day)).map(m => (
                      <MultiCard key={m.id} multi={m} currentUserId={currentUserId} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}


      {filtered.length === 0 && (
        <div className="text-center mt-8 p-6 bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/30 rounded-xl shadow-2xl shadow-purple-500/10">
          <p className="text-center text-sm text-gray-500">
            선택한 게임 및 주차에 해당하는 레이싱 이벤트가 없습니다.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            다른 주차나 게임을 선택해보세요!
          </p>
        </div>
      )}
    </div>
  )
}
