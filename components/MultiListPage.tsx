// ✅ components/MultiListPage.tsx (최종본)
'use client'

import { useEffect, useState } from 'react'
import MultiCard from './MultiCard'
import type { Database } from '@/lib/database.types'
import { getWeekRange } from '@/app/utils/dateUtils'
import WeekFilter from './WeekFilter'

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일']
const allGames = ['컴페티치오네', '아세토코르사', '그란투리스모7', '르망얼티밋', '아이레이싱', '알펙터2']

type Multi = Database['public']['Tables']['multis']['Row']

type MultiListPageProps = {
  currentUserId: string | null
}

export default function MultiListPage({ currentUserId }: MultiListPageProps) {
  const [multis, setMultis] = useState<Multi[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>(allGames)

  const today = new Date()
  const oneJan = new Date(today.getFullYear(), 0, 1)
  const currentWeek = Math.ceil((((+today - +oneJan) / 86400000) + oneJan.getDay() + 1) / 7)
  const todayKoreanWeekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(today)

  const [year, setYear] = useState(today.getFullYear())
  const [week, setWeek] = useState(currentWeek)

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

  const { start, end } = getWeekRange(year, week)

  const filtered = multis.filter(multi => {
    const date = multi.created_at?.split('T')[0] ?? ''
    return (
      selectedGames.includes(multi.game) &&
      date >= start && date <= end
    )
  })

  const groupedByGame = filtered.reduce<Record<string, Multi[]>>((acc, multi) => {
    if (!acc[multi.game]) acc[multi.game] = []
    acc[multi.game].push(multi)
    return acc
  }, {})

  return (
    <div className="p-6 min-w-screen-2xl max-w-full mx-auto">
      {/* 필터 */}
      <div className="mb-6 border p-4 rounded bg-white shadow-sm">
        <h2 className="font-semibold mb-2">게임 필터</h2>
        <div className="flex flex-wrap gap-4 items-center">
          {allGames.map(game => (
            <label key={game} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={selectedGames.includes(game)}
                onChange={() => toggleGameSelection(game)}
              />
              <span>{game}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6 ml-auto">
        <WeekFilter
            year={year}
            week={week}
            setYear={setYear}
            setWeek={setWeek}
            minWeek={currentWeek - 1}
            maxWeek={currentWeek + 4}
          />
      </div>
          
      {/* 게임 별 요일 가능 공지 */}
      {Object.entries(groupedByGame).map(([game, gameMultis]) => (
        <div key={game} className="mb-10 border border-gray-300 rounded-lg p-4 bg-white shadow-sm"> {/*카테고리 구분선*/}
          <h2 className="text-xl font-bold mb-3">{game}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto">
            {daysOfWeek.map(day => {
              const isToday = day === todayKoreanWeekday
              return (
                <div key={day} className="min-w-[150px]">
                  <div className={`text-center font-semibold border-b pb-1 mb-2 ${isToday ? 'border-none bg-green-50 text-black-600 rounded' : ''}`}>
                    {day}
                  </div>
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
        <p className="text-gray-500 mt-6">선택한 게임 및 주차에 해당하는 공지가 없습니다.</p>
      )}
    </div>
  )
}
