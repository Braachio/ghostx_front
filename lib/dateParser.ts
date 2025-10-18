// lib/dateParser.ts
import { getISOWeek } from 'date-fns'

export function parseCsvDateToWeek(dateStr: string): { year: number; week: number; eventDate: string } {
  try {
    const now = new Date()
    const year = now.getFullYear()

    const cleaned = dateStr.replace('월', '').replace('일', '')
    const [monthStr, dayStr] = cleaned.split(' ').filter(Boolean)

    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    const date = new Date(year, month - 1, day)
    const week = getISOWeek(date)
    
    // event_date를 ISO 문자열로 반환
    const eventDate = date.toISOString().split('T')[0] // YYYY-MM-DD 형식

    return { year, week, eventDate }
  } catch (e) {
    console.error('날짜 파싱 오류:', dateStr, e)
    return { year: 0, week: 0, eventDate: '' }
  }
}
