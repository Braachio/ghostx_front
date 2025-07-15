'use client'

import { useState, useMemo } from 'react'
import { Disclosure } from '@headlessui/react'
import { ChevronUpIcon } from 'lucide-react'
import { formatLapTime } from '@/lib/formatters'

type LapMeta = {
  id: string
  display_name?: string
  track: string
  car: string
  lap_time?: number
  created_at: string
}

type Props = {
  lapList: LapMeta[]
  onSelect: (lapId: string) => void
}

export default function LapBrowser({ lapList, onSelect }: Props) {
  const [viewMode, setViewMode] = useState<'car' | 'track'>('car')
  const [search, setSearch] = useState('')

  const filteredList = useMemo(() => {
    const lower = search.toLowerCase()
    return lapList.filter(
      lap =>
        lap.track.toLowerCase().includes(lower) ||
        lap.car.toLowerCase().includes(lower) ||
        lap.display_name?.toLowerCase().includes(lower) ||
        new Date(lap.created_at).toLocaleDateString().includes(lower)
    )
  }, [lapList, search])

  const grouped = useMemo(() => {
    const key = viewMode === 'car' ? 'car' : 'track'
    return filteredList.reduce<Record<string, LapMeta[]>>((acc, lap) => {
      const groupKey = lap[key] || '기타'
      if (!acc[groupKey]) acc[groupKey] = []
      acc[groupKey].push(lap)
      return acc
    }, {})
  }, [filteredList, viewMode])

  return (
    <div className="space-y-4">
      {/* 🔀 보기 전환 + 검색 */}
      <div className="flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('car')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'car' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100'}`}
          >
            🚗 차량별 보기
          </button>
          <button
            onClick={() => setViewMode('track')}
            className={`px-3 py-1 text-sm rounded ${viewMode === 'track' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100'}`}
          >
            🛣️ 트랙별 보기
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 이름, 트랙, 차량, 날짜"
          className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
      </div>

      {/* 📁 폴더 구조 */}
      <div className="space-y-2">
        {Object.entries(grouped).map(([group, laps]) => (
            <Disclosure key={group}>
            {({ open }) => (
                <div> {/* ✅ Fragment 대신 div로 감쌈 */}
                <Disclosure.Button className="flex justify-between w-full bg-gray-100 dark:bg-gray-700 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    <span>{group}</span>
                    <ChevronUpIcon className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-2 pb-2 text-sm text-gray-800 dark:text-gray-100 space-y-1">
                    {laps.map(lap => (
                    <button
                        key={lap.id}
                        onClick={() => onSelect(lap.id)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                        <div className="font-medium">{lap.display_name || `${lap.track} - ${lap.car}`}</div>
                        <div className="text-xs text-gray-500">
                        🕒 {lap.lap_time ? formatLapTime(lap.lap_time) : '랩타임 없음'} | 📅{' '}
                        {new Date(lap.created_at).toLocaleDateString()}
                        </div>
                    </button>
                    ))}
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  )
}
