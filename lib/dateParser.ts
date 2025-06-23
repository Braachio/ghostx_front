// lib/dateParser.ts
import { getISOWeek } from 'date-fns'

export function parseCsvDateToWeek(dateStr: string): { year: number; week: number } {
  try {
    const now = new Date()
    const year = now.getFullYear()

    const cleaned = dateStr.replace('월', '').replace('일', '')
    const [monthStr, dayStr] = cleaned.split(' ').filter(Boolean)

    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    const date = new Date(year, month - 1, day)
    const week = getISOWeek(date)

    return { year, week }
  } catch (e) {
    console.error('날짜 파싱 오류:', dateStr, e)
    return { year: 0, week: 0 }
  }
}
