// ISO 8601 기준 현재 주차 계산 (1월 4일이 포함된 주가 1주차)
export function getCurrentWeekNumber() {
  const today = new Date()

  // 해당 날짜의 목요일로 이동 (ISO 8601 기준은 목요일로 연도 판단)
  const target = new Date(today)
  const day = target.getDay()
  const isoDay = day === 0 ? 7 : day // 일요일 보정
  target.setDate(target.getDate() + 4 - isoDay)

  const yearStart = new Date(target.getFullYear(), 0, 1)
  const firstThursday = new Date(yearStart)
  const firstDay = yearStart.getDay() || 7
  firstThursday.setDate(yearStart.getDate() + 4 - firstDay)

  const diff = target.getTime() - firstThursday.getTime()
  const week = 1 + Math.floor(diff / (7 * 86400000))

  return {
    year: target.getFullYear(),
    week,
  }
}

// ISO 8601 기준 주차 범위 반환
export function getWeekRange(year: number, week: number) {
  // 기준일: 1월 4일 (항상 1주차 포함)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7

  // 해당 주의 월요일 계산
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
