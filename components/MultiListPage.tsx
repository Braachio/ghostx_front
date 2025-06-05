'use client'

import { useEffect, useState } from 'react'
import MultiCard from './MultiCard'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

const allGames = [
  '컴페티치오네',
  '아세토코르사',
  '그란투리스모7',
  '르망얼티밋',
  '아이레이싱',
  '알펙터2',
]

export default function MultiListPage({
  currentUserId,
}: {
  currentUserId: string | null
  simplified?: boolean
}) {
  const [multis, setMultis] = useState<Multi[]>([])
  const [selectedGames, setSelectedGames] = useState<string[]>(allGames)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    const fetchMultis = async () => {
      const res = await fetch('/api/multis')
      const data: Multi[] = await res.json()
      setMultis(data)
    }

    fetchMultis()
  }, [])

  const toggleGameSelection = (game: string) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    )
  }

  const filtered = multis
    .filter((multi) => selectedGames.includes(multi.game))
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const groupedByGame = filtered.reduce<Record<string, Multi[]>>((acc, multi) => {
    if (!acc[multi.game]) acc[multi.game] = []
    acc[multi.game].push(multi)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 🔍 게임 필터 및 정렬 */}
      <div className="mb-6 border p-4 rounded bg-white shadow-sm">
        <h2 className="font-semibold mb-2">🎮 게임 필터</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          {allGames.map((game) => (
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
        <div className="text-sm space-x-2">
          <label>
            <input
              type="radio"
              name="sort"
              value="newest"
              checked={sortOrder === 'newest'}
              onChange={() => setSortOrder('newest')}
            />{' '}
            최신순
          </label>
          <label>
            <input
              type="radio"
              name="sort"
              value="oldest"
              checked={sortOrder === 'oldest'}
              onChange={() => setSortOrder('oldest')}
            />{' '}
            오래된순
          </label>
        </div>
      </div>

      {/* 📃 게임별 공지 리스트 */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">선택한 게임에 해당하는 공지가 없습니다.</p>
      ) : (
        Object.entries(groupedByGame).map(([game, gameMultis]) => (
          <div key={game} className="mb-8">
            <h2 className="text-xl font-bold border-b pb-1 mb-3">{game}</h2>
            <div className="space-y-4">
              {gameMultis.map((multi) => (
                <MultiCard key={multi.id} multi={multi} currentUserId={currentUserId} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
