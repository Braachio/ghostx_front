// lib/dateParser.ts
import { getISOWeek } from 'date-fns'

export function parseCsvDateToWeek(dateStr: string): { year: number; week: number; eventDate: string } {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()

    const cleaned = dateStr.replace('월', '').replace('일', '')
    const [monthStr, dayStr] = cleaned.split(' ').filter(Boolean)

    const month = parseInt(monthStr, 10)
    const day = parseInt(dayStr, 10)

    // 현재 날짜와 비교하여 올바른 연도 결정
    let year = currentYear
    let targetDate = new Date(currentYear, month - 1, day)
    
    // 만약 입력된 날짜가 현재 날짜보다 이전이면 다음 해로 설정
    if (targetDate < now) {
      year = currentYear + 1
      targetDate = new Date(year, month - 1, day)
    }
    
    // 이번주/다음주 판단 로직 수정
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - now.getDay()) // 이번주 일요일
    thisWeekStart.setHours(0, 0, 0, 0)
    
    const thisWeekEnd = new Date(thisWeekStart)
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6) // 이번주 토요일
    thisWeekEnd.setHours(23, 59, 59, 999)
    
    const nextWeekStart = new Date(thisWeekStart)
    nextWeekStart.setDate(thisWeekStart.getDate() + 7) // 다음주 일요일
    
    const nextWeekEnd = new Date(nextWeekStart)
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6) // 다음주 토요일
    nextWeekEnd.setHours(23, 59, 59, 999)
    
    console.log('주차 판단 로직:', {
      input: dateStr,
      targetDate: targetDate.toISOString(),
      thisWeekStart: thisWeekStart.toISOString(),
      thisWeekEnd: thisWeekEnd.toISOString(),
      nextWeekStart: nextWeekStart.toISOString(),
      nextWeekEnd: nextWeekEnd.toISOString(),
      isThisWeek: targetDate >= thisWeekStart && targetDate <= thisWeekEnd,
      isNextWeek: targetDate >= nextWeekStart && targetDate <= nextWeekEnd
    })
    
    // 이번주 범위에 있는지 확인 (일요일 00:00 ~ 토요일 23:59)
    if (targetDate >= thisWeekStart && targetDate <= thisWeekEnd) {
      // 이번주에 해당하는 경우, 현재 주차 사용
      const week = getISOWeek(now)
      const eventDate = targetDate.toISOString().split('T')[0]
      
      console.log('이번주 날짜로 인식:', {
        input: dateStr,
        targetDate: eventDate,
        thisWeekStart: thisWeekStart.toISOString(),
        thisWeekEnd: thisWeekEnd.toISOString()
      })
      
      return { year: currentYear, week, eventDate }
    }
    
    // 다음주 범위에 있는지 확인 (일요일 00:00 ~ 토요일 23:59)
    if (targetDate >= nextWeekStart && targetDate <= nextWeekEnd) {
      // 다음주에 해당하는 경우
      const nextWeekDate = new Date(nextWeekStart)
      const week = getISOWeek(nextWeekDate)
      const eventDate = targetDate.toISOString().split('T')[0]
      
      console.log('다음주 날짜로 인식:', {
        input: dateStr,
        targetDate: eventDate,
        nextWeekStart: nextWeekStart.toISOString(),
        nextWeekEnd: nextWeekEnd.toISOString()
      })
      
      return { year: currentYear, week, eventDate }
    }
    
    // 기본 로직 (기존과 동일)
    const week = getISOWeek(targetDate)
    const eventDate = targetDate.toISOString().split('T')[0]
    
    console.log('기본 날짜 계산:', {
      input: dateStr,
      targetDate: eventDate,
      year,
      week
    })

    return { year, week, eventDate }
  } catch (e) {
    console.error('날짜 파싱 오류:', dateStr, e)
    return { year: 0, week: 0, eventDate: '' }
  }
}
