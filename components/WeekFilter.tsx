'use client'

import { useMemo } from 'react'
import { getCurrentWeekNumber } from '@/app/utils/dateUtils'
interface WeekFilterProps {
  year: number
  week: number
  setYear: (y: number) => void
  setWeek: (w: number) => void
  minWeek: number
  maxWeek: number
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

  const current = getCurrentWeekNumber() // ✅ 정확한 ISO 주차
  const currentYear = current.year
  const currentWeek = current.week

  const options = useMemo(() => {
    return Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => {
      const w = minWeek + i
      let label = ''

      if (year === currentYear && w === currentWeek - 1) label = '저번주'
      else if (year === currentYear && w === currentWeek) label = '이번주'
      else if (year === currentYear && w === currentWeek + 1) label = '다음주'
      else if (year === currentYear && w === currentWeek + 2) label = '다다음주'
      else label = `${w}주차`

      return {
        label,
        value: `${year}-${w}`,
      }
    })
  }, [year, minWeek, maxWeek, currentWeek, currentYear])

  return (
    <div className="flex items-center gap-4 text-black dark:text-white">
      <div className="text-base font-semibold whitespace-nowrap">
        {year}년 {week}주차
      </div>

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
