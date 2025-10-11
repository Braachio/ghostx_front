'use client'

import { useMemo } from 'react'
import { getCurrentWeekInfo } from '@/app/utils/weekUtils'

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

  const current = getCurrentWeekInfo() // ✅ 정확한 주차 계산
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
    <div className="flex items-center gap-4 text-white bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border border-purple-500/30">
      <div className="text-base font-semibold whitespace-nowrap text-cyan-400">
        📅 {year}년 {week}주차
      </div>

      <select
        value={`${year}-${week}`}
        onChange={handleChange}
        className="border-2 border-cyan-500/30 p-2 rounded-lg bg-gray-800 text-white focus:border-cyan-400 focus:outline-none transition-colors"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-gray-800">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
