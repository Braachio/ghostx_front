// 📁 app/utils/dateUtils.ts
import { WeekRange } from '../types'

export function getWeekRange(year: number, week: number): WeekRange {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7 // 1=월요일 ... 7=일요일
  const weekStart = new Date(jan4)
  weekStart.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)

  return {
    year,
    week,
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  }
}

export function getCurrentWeekNumber(): { year: number; week: number } {
  const now = new Date()
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000
  const dayOfWeek = startOfYear.getUTCDay() || 7
  const week = Math.ceil((pastDaysOfYear + dayOfWeek - 1) / 7)
  return { year: now.getUTCFullYear(), week }
}
