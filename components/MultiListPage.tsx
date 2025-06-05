// components/MultiListPage.tsx
'use client'

import { useEffect, useState } from 'react'
import MultiCard from './MultiCard'
import type { Database } from '@/lib/database.types'

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일']

const allGames = [
  '컴페티치오네',
  '아세토코르사',
  '그란투리스모7',
  '르망얼티밋',
  '아이레이싱',
  '알펙터2',
]

type Multi = Database['public']['Tables']['multis']['Row']

type MultiListPageProps = {
  currentUserId: string | null
}

export default function MultiListPage({ currentUserId }: MultiListPageProps) {
  const [multis, setMultis] = useState<Multi[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>(allGames)

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

  const filtered = multis.filter(multi => selectedGames.includes(multi.game))

  const groupedByGame = filtered.reduce<Record<string, Multi[]>>((acc, multi) => {
    if (!acc[multi.game]) acc[multi.game] = []
    acc[multi.game].push(multi)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 🎮 게임 필터 */}
      <div className="mb-6 border p-4 rounded bg-white shadow-sm">
        <h2 className="font-semibold mb-2">🎮 게임 필터</h2>
        <div className="flex flex-wrap gap-3">
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

      {/* 📅 게임별 요일별 주간 공지 */}
      {Object.entries(groupedByGame).map(([game, gameMultis]) => (
        <div key={game} className="mb-10">
          <h2 className="text-xl font-bold mb-3">{game}</h2>
          <div className="grid grid-cols-7 gap-4">
            {daysOfWeek.map(day => (
              <div key={day} className="min-h-[220px]">
                <div className="text-center font-semibold border-b pb-1 mb-2">{day}</div>
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {gameMultis
                    .filter(m => m.multi_day.includes(day))
                    .map(m => (
                      <MultiCard key={m.id} multi={m} currentUserId={currentUserId} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-gray-500 mt-6">선택한 게임에 해당하는 공지가 없습니다.</p>
      )}
    </div>
  )
}
