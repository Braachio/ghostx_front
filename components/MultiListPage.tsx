// ✅ 다크모드 + 이번주 디폴트 적용된 전체 코드
'use client'

import { useEffect, useState } from 'react'
import MultiCard from './MultiCard'
import type { Database } from '@/lib/database.types'
import { getWeekRange, getCurrentWeekNumber } from '@/app/utils/dateUtils'
import WeekFilter from './WeekFilter'

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일']
const allGames = ['컴페티치오네', '아세토코르사', '그란투리스모7', '르망얼티밋','EA WRC', '아이레이싱', '알펙터2']

type Multi = Database['public']['Tables']['multis']['Row']

type MultiListPageProps = {
  currentUserId: string | null
}

export default function MultiListPage({ currentUserId }: MultiListPageProps) {
  const [multis, setMultis] = useState<Multi[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>(allGames)

  const current = getCurrentWeekNumber()
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
    return (
      selectedGames.includes(multi.game) &&
      multi.year === year &&
      multi.week === week
    )
  })

  const groupedByGame = filtered.reduce<Record<string, Multi[]>>((acc, multi) => {
    if (!acc[multi.game]) acc[multi.game] = []
    acc[multi.game].push(multi)
    return acc
  }, {})

  const { start } = getWeekRange(year, week)
  const startDate = new Date(start)

  return (
    <div className="p-6 max-w-screen-2xl mx-auto transition-colors duration-300 text-black dark:text-white">
      {/* 필터 */}
      <div className="mb-6 border p-4 rounded bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
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
        <div key={game} className="mb-10 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm">
          <h2 className="text-xl font-bold mb-3">{game}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 overflow-x-auto">
            {daysOfWeek.map((day, i) => {
              const isToday = day === todayKoreanWeekday
              const dateObj = new Date(startDate)
              dateObj.setDate(startDate.getDate() + i)
              const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
              return (
                <div key={day} className="min-w-[150px]">
                  <div
                    className={`text-center font-semibold border-b pb-1 mb-2
                      ${isToday ? 'border-none bg-green-50 dark:bg-green-900 dark:text-green-300 rounded' : ''}
                      ${day === '일' ? 'text-red-500' : day === '토' ? 'text-blue-500' : ''}`}
                  >
                    {day} ({dateStr})
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
        <p className="text-gray-500 dark:text-gray-400 mt-6">
          선택한 게임 및 주차에 해당하는 공지가 없습니다.
        </p>
      )}
    </div>
  )
}
