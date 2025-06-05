// 4. components/WeekFilter.tsx
import { getWeekRange } from '@/app/utils/dateUtils'

type WeekFilterProps = {
  year: number
  week: number
  setYear: React.Dispatch<React.SetStateAction<number>>
  setWeek: React.Dispatch<React.SetStateAction<number>>
}

export default function WeekFilter({ year, week, setYear, setWeek }: WeekFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [y, w] = e.target.value.split('-')
    setYear(Number(y))
    setWeek(Number(w))
  }

  const options = Array.from({ length: 20 }, (_, i) => {
    const y = 2025
    const w = i + 1
    const range = getWeekRange(y, w)
    return (
      <option key={w} value={`${y}-${w}`}>
        {y}년 {w}주차 ({range.start}~{range.end})
      </option>
    )
  })

  return (
    <select value={`${year}-${week}`} onChange={handleChange} className="border p-2 rounded">
      {options}
    </select>
  )
}
