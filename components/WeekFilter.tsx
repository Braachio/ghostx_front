// 📁 components/WeekFilter.tsx
'use client'

import { getWeekRange } from '@/app/utils/dateUtils'
import { useMemo } from 'react'

interface WeekFilterProps {
  year: number
  week: number
  setYear: (y: number) => void
  setWeek: (w: number) => void
  minWeek: number
  maxWeek: number
}

export default function WeekFilter({ year, week, setYear, setWeek, minWeek, maxWeek }: WeekFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, w] = e.target.value.split('-')
    setYear(Number(y))
    setWeek(Number(w))
  }

  const options = useMemo(() => {
    return Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => {
      const w = minWeek + i
      const range = getWeekRange(year, w)
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const thisWeek = getWeekRange(year, w).start <= today && getWeekRange(year, w).end >= today
      return (
        <option key={w} value={`${year}-${w}`}>
          {year}년 {w}주차 ({range.start}~{range.end}){thisWeek ? ' (이번주)' : ''}
        </option>
      )
    })
  }, [year, minWeek, maxWeek])

  return (
    <select
      value={`${year}-${week}`}
      onChange={handleChange}
      className="border p-2 rounded"
    >
      {options}
    </select>
  )
}
