export function getWeekRange(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
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

export function getCurrentWeekNumber() {
  const today = new Date()
  const oneJan = new Date(today.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((today.getTime() - oneJan.getTime()) / 86400000)
  return {
    year: today.getFullYear(),
    week: Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7),
  }
}
