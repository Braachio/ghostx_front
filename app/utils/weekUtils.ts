// ISO 8601 표준을 따르는 정확한 주차 계산 유틸리티

/**
 * ISO 8601 주차 계산
 * - 월요일을 주의 시작으로 함
 * - 연도의 첫 번째 목요일이 있는 주가 1주차
 */
export function getISOWeek(date: Date): { year: number; week: number } {
  // UTC로 변환하여 시간대 문제 방지
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  
  // 목요일을 찾기 (ISO 8601 기준)
  const dayOfWeek = tempDate.getUTCDay() || 7 // 일요일을 7로 변환
  const thursday = new Date(tempDate)
  thursday.setUTCDate(tempDate.getUTCDate() + 4 - dayOfWeek)
  
  // 해당 목요일의 연도
  const year = thursday.getUTCFullYear()
  
  // 연도 첫 번째 목요일 찾기
  const jan1 = new Date(Date.UTC(year, 0, 1))
  const jan1Day = jan1.getUTCDay() || 7
  const firstThursday = new Date(jan1)
  
  if (jan1Day <= 4) {
    // 1월 1일이 월~목 사이면 해당 주가 1주차
    firstThursday.setUTCDate(jan1.getUTCDate() + 4 - jan1Day)
  } else {
    // 1월 1일이 금~일 사이면 다음 주가 1주차
    firstThursday.setUTCDate(jan1.getUTCDate() + 11 - jan1Day)
  }
  
  // 주차 계산
  const week = Math.ceil((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  
  return { year, week }
}

/**
 * 특정 연도, 주차의 월요일 날짜 계산
 */
export function getDateFromISOWeek(year: number, week: number): Date {
  // 해당 연도의 첫 번째 목요일 찾기
  const jan1 = new Date(Date.UTC(year, 0, 1))
  const jan1Day = jan1.getUTCDay() || 7
  const firstThursday = new Date(jan1)
  
  if (jan1Day <= 4) {
    firstThursday.setUTCDate(jan1.getUTCDate() + 4 - jan1Day)
  } else {
    firstThursday.setUTCDate(jan1.getUTCDate() + 11 - jan1Day)
  }
  
  // 해당 주차의 목요일
  const targetThursday = new Date(firstThursday)
  targetThursday.setUTCDate(firstThursday.getUTCDate() + (week - 1) * 7)
  
  // 목요일에서 월요일로 (3일 빼기)
  const monday = new Date(targetThursday)
  monday.setUTCDate(targetThursday.getUTCDate() - 3)
  
  return monday
}

/**
 * 특정 연도, 주차의 주간 날짜 범위 계산
 */
export function getWeekDateRange(year: number, week: number): { start: Date; end: Date } {
  // 1주차 = 1월 1일이 포함된 주
  const jan1 = new Date(year, 0, 1, 12, 0, 0) // 정오 12시로 설정해서 시간대 문제 방지
  const jan1Day = jan1.getDay() // 0(일) ~ 6(토)
  
  // 1월 1일이 포함된 주의 월요일 찾기
  let daysFromMonday
  if (jan1Day === 0) {
    daysFromMonday = 6 // 일요일이면 6일 전이 월요일
  } else {
    daysFromMonday = jan1Day - 1 // 월요일(1)이면 0일 전
  }
  
  // 첫 번째 월요일 계산 - getTime()으로 밀리초 계산
  const firstMondayTime = jan1.getTime() - (daysFromMonday * 24 * 60 * 60 * 1000)
  const firstMonday = new Date(firstMondayTime)
  
  // N주차의 월요일 = 1주차 월요일 + (N-1) * 7일
  const targetMondayTime = firstMondayTime + ((week - 1) * 7 * 24 * 60 * 60 * 1000)
  const targetMonday = new Date(targetMondayTime)
  targetMonday.setHours(0, 0, 0, 0) // 자정으로 초기화
  
  // 일요일 = 월요일 + 6일
  const sundayTime = targetMondayTime + (6 * 24 * 60 * 60 * 1000)
  const sunday = new Date(sundayTime)
  sunday.setHours(23, 59, 59, 999) // 하루의 끝으로 설정
  
  console.log(`주차 범위 계산:`, {
    year,
    week,
    jan1: jan1.toDateString(),
    jan1Day,
    daysFromMonday,
    firstMonday: firstMonday.toDateString(),
    targetMonday: targetMonday.toDateString(),
    sunday: sunday.toDateString()
  })
  
  return { start: targetMonday, end: sunday }
}

/**
 * 특정 연도, 주차, 요일의 정확한 날짜 계산
 */
export function getDateFromWeekAndDay(year: number, week: number, dayName: string): Date {
  const dayMap: Record<string, number> = {
    '월': 0, '화': 1, '수': 2, '목': 3, '금': 4, '토': 5, '일': 6
  }
  
  const dayOffset = dayMap[dayName]
  if (dayOffset === undefined) return null
  
  // 간단한 주차 계산: 1월 1일부터 시작
  const jan1 = new Date(year, 0, 1) // 1월 1일
  const jan1Day = jan1.getDay() // 0(일) ~ 6(토)
  
  // 1월 1일이 포함된 주의 월요일 찾기
  let daysFromMonday
  if (jan1Day === 0) {
    daysFromMonday = 6 // 일요일이면 6일 전이 월요일
  } else {
    daysFromMonday = jan1Day - 1 // 월요일(1)이면 0일 전
  }
  
  // 첫 번째 월요일
  const firstMonday = new Date(jan1)
  firstMonday.setDate(jan1.getDate() - daysFromMonday)
  
  // N주차의 월요일 = 1주차 월요일 + (N-1) * 7일
  const targetMonday = new Date(firstMonday)
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7)
  
  // 해당 요일로 이동
  const targetDate = new Date(targetMonday)
  targetDate.setDate(targetMonday.getDate() + dayOffset)
  
  console.log(`간단한 주차 계산:`, {
    year,
    week,
    dayName,
    dayOffset,
    jan1: jan1.toDateString(),
    firstMonday: firstMonday.toDateString(),
    targetMonday: targetMonday.toDateString(),
    targetDate: targetDate.toDateString(),
    today: new Date().toDateString()
  })
  
  return targetDate
}

/**
 * 현재 시점 기준 주차 정보
 */
export function getCurrentWeekInfo(): { year: number; week: number; start: Date; end: Date } {
  const now = new Date()
  const year = now.getFullYear()
  
  // 현재 날짜가 속한 주의 월요일 찾기 - 밀리초 기반 계산
  const currentDay = now.getDay() // 0(일) ~ 6(토)
  let daysFromMonday
  if (currentDay === 0) {
    daysFromMonday = 6 // 일요일이면 6일 전이 월요일
  } else {
    daysFromMonday = currentDay - 1 // 월요일(1)이면 0일 전
  }
  
  // 정오 12시 기준으로 날짜 계산 (시간대 문제 방지)
  const todayNoon = new Date(year, now.getMonth(), now.getDate(), 12, 0, 0)
  const currentMondayTime = todayNoon.getTime() - (daysFromMonday * 24 * 60 * 60 * 1000)
  const currentMonday = new Date(currentMondayTime)
  currentMonday.setHours(0, 0, 0, 0)
  
  // 1월 1일이 포함된 주의 월요일 찾기
  const jan1 = new Date(year, 0, 1, 12, 0, 0) // 정오 12시
  const jan1Day = jan1.getDay()
  let jan1DaysFromMonday
  if (jan1Day === 0) {
    jan1DaysFromMonday = 6
  } else {
    jan1DaysFromMonday = jan1Day - 1
  }
  
  const jan1MondayTime = jan1.getTime() - (jan1DaysFromMonday * 24 * 60 * 60 * 1000)
  const jan1Monday = new Date(jan1MondayTime)
  jan1Monday.setHours(0, 0, 0, 0)
  
  // 주차 계산: (현재 월요일 - 1월 1일 월요일) / 7 + 1
  const daysDiff = Math.floor((currentMondayTime - jan1MondayTime) / (24 * 60 * 60 * 1000))
  const week = Math.floor(daysDiff / 7) + 1
  
  // 디버깅: 주차 계산 과정 출력
  console.log(`주차 계산 과정:`, {
    currentMondayTime,
    jan1MondayTime,
    daysDiff,
    calculatedWeek: week,
    currentDate: now.toDateString()
  })
  
  const { start, end } = getWeekDateRange(year, week)
  
  console.log(`현재 주차 계산:`, {
    today: now.toDateString(),
    todayDay: currentDay,
    currentMonday: currentMonday.toDateString(),
    jan1: jan1.toDateString(),
    jan1Day,
    jan1Monday: jan1Monday.toDateString(),
    daysDiff,
    week,
    year,
    start: start.toDateString(),
    end: end.toDateString()
  })
  
  return { year, week, start, end }
}

/**
 * 주차 라벨 생성 (이번주, 다음주 등)
 */
export function getWeekLabel(year: number, week: number): string {
  const current = getCurrentWeekInfo()
  
  if (year === current.year) {
    const diff = week - current.week
    switch (diff) {
      case 0: return '이번주'
      case 1: return '다음주'
      case 2: return '2주 후'
      case 3: return '3주 후'
      case -1: return '지난주'
      case -2: return '2주 전'
      default: return diff > 0 ? `${diff}주 후` : `${Math.abs(diff)}주 전`
    }
  }
  
  return `${week}주차`
}

/**
 * 주차 옵션 생성 (더 넓은 범위로 확장)
 */
export function getWeekOptions(currentYear: number = new Date().getFullYear(), centerWeek?: number): Array<{value: number; label: string; year: number}> {
  const current = getCurrentWeekInfo()
  const options = []
  
  // 현재 연도만 처리
  if (currentYear === current.year) {
    // centerWeek가 지정되면 해당 주차를 중심으로, 아니면 현재 주차를 중심으로
    const baseWeek = centerWeek || current.week
    
    // 지난 3주(-3)부터 4주 후(+4)까지 = 총 8주 (더 넓은 범위)
    for (let i = -3; i <= 4; i++) {
      const weekNum = baseWeek + i
      if (weekNum >= 1 && weekNum <= 53) { // ISO 주차는 최대 53주차
        options.push({
          value: weekNum,
          label: getWeekLabel(current.year, weekNum),
          year: current.year
        })
      }
    }
  } else {
    // 다른 연도는 전체 주차 표시
    for (let weekNum = 1; weekNum <= 53; weekNum++) {
      options.push({
        value: weekNum,
        label: getWeekLabel(currentYear, weekNum),
        year: currentYear
      })
    }
  }
  
  return options
}

/**
 * 기습갤멀용 주차 옵션 생성 (이번주, 다음주만)
 */
export function getFlashEventWeekOptions(currentYear: number = new Date().getFullYear()): Array<{value: number; label: string; year: number}> {
  const current = getCurrentWeekInfo()
  const options = []
  
  // 현재 연도만 처리
  if (currentYear === current.year) {
    // 이번주와 다음주만
    for (let i = 0; i <= 1; i++) {
      const weekNum = current.week + i
      if (weekNum >= 1 && weekNum <= 53) { // ISO 주차는 최대 53주차
        options.push({
          value: weekNum,
          label: getWeekLabel(current.year, weekNum),
          year: current.year
        })
      }
    }
  }
  
  return options
}
