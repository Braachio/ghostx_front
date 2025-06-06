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

export default function WeekFilter({ year, week, setYear, setWeek, minWeek, maxWeek }: WeekFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, w] = e.target.value.split('-')
    setYear(Number(y))
    setWeek(Number(w))
  }

  const today = new Date()
  const currentYear = today.getFullYear()
  const oneJan = new Date(currentYear, 0, 1)
  const currentWeek = Math.ceil((((+today - +oneJan) / 86400000) + oneJan.getDay() + 1) / 7)

  const options = useMemo(() => {
    return Array.from({ length: maxWeek - minWeek + 1 }, (_, i) => {
      const w = minWeek + i
      let label = ''

      if (w === currentWeek - 1) label = '저번주'
      else if (w === currentWeek) label = '이번주'
      else if (w === currentWeek + 1) label = '다음주'
      else if (w === currentWeek + 2) label = '다다음주'
      else label = `${w}주차`

      return {
        label,
        value: `${year}-${w}`,
      }
    })
  }, [year, minWeek, maxWeek, currentWeek])

  return (
    <div className="flex items-center gap-4">
      {/* 현재 주차 표시 */}
      <div className="text-base font-semibold whitespace-nowrap">
        {year}년 {week}주차
      </div>

      {/* 드롭다운 */}
      <select
        value={`${year}-${week}`}
        onChange={handleChange}
        className="border p-2 rounded"
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
