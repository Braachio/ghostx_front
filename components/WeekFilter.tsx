'use client'

import { useMemo } from 'react'

interface WeekFilterProps {
  year: number
  week: number
  setYear: (y: number) => void
  setWeek: (w: number) => void
  minWeek: number
  maxWeek: number
}

// ISO 8601 기준 주차 계산 함수
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf())
  const dayNumber = (target.getDay() + 6) % 7 // ISO 요일 (월=0, 일=6)
  target.setDate(target.getDate() - dayNumber + 3) // 해당 주의 목요일
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff = target.getTime() - firstThursday.getTime()
  return 1 + Math.round(diff / (7 * 86400000))
}

export default function WeekFilter({
  year,
  week,
  setYear,
  setWeek,
  minWeek,
  maxWeek,
}: WeekFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, w] = e.target.value.split('-')
    setYear(Number(y))
    setWeek(Number(w))
  }

  const options = useMemo(() => {
    const today = new Date()
    const currentWeek = getISOWeekNumber(today)

    return Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => {
      const w = minWeek + i
      let label = ''

      if (w === currentWeek - 1) label = '저번주'
      else if (w === currentWeek) label = '이번주'
      else if (w === currentWeek + 1) label = '다음주'
      else if (w === currentWeek + 2) label = '다다음주'

      return {
        label,
        value: `${year}-${w}`,
      }
    })
  }, [year, minWeek, maxWeek])

  return (
    <div className="flex items-center gap-4 text-black dark:text-white">
      {/* 현재 주차 표시 */}
      <div className="text-base font-semibold whitespace-nowrap">
        {year}년 {week}주차
      </div>

      {/* 드롭다운 */}
      <select
        value={`${year}-${week}`}
        onChange={handleChange}
        className="border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
