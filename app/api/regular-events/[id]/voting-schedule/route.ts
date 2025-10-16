import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// POST /api/regular-events/[id]/voting-schedule - 투표 스케줄 생성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    console.log('투표 스케줄 생성 요청:', { regularEventId: id, body })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, day_of_week')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 스케줄을 생성할 수 있습니다.' }, { status: 403 })
    }

    const { weeks_ahead = 4 } = body

    // 현재 주차 계산
    const now = new Date()
    const currentWeek = getWeekNumber(now)
    const currentYear = now.getFullYear()

    const schedules = []

    // 지정된 주 수만큼 투표 스케줄 생성
    for (let i = 0; i < weeks_ahead; i++) {
      const weekNumber = currentWeek + i
      const year = currentYear
      
      // 이벤트 요일을 숫자로 변환 (일요일=0)
      const dayMapping: Record<string, number> = {
        '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
      }
      
      const eventDayOfWeek = dayMapping[event.day_of_week] || 0
      
      // 해당 주의 이벤트 날짜 계산
      const eventDate = getDateOfWeek(weekNumber, year, eventDayOfWeek)
      
      // 투표 시작: 이벤트 다음날 00:00
      const votingStart = new Date(eventDate)
      votingStart.setDate(votingStart.getDate() + 1)
      votingStart.setHours(0, 0, 0, 0)
      
      // 투표 종료: 투표 시작 4일 후 23:59
      const votingEnd = new Date(votingStart)
      votingEnd.setDate(votingEnd.getDate() + 4)
      votingEnd.setHours(23, 59, 59, 999)

      // 투표 스케줄 생성
      const { data: schedule, error: scheduleError } = await supabase
        .from('vote_schedules')
        .upsert({
          regular_event_id: id,
          week_number: weekNumber,
          year: year,
          voting_start: votingStart.toISOString(),
          voting_end: votingEnd.toISOString(),
          is_active: true
        }, {
          onConflict: 'regular_event_id,week_number,year'
        })
        .select()
        .single()

      if (scheduleError) {
        console.error(`주차 ${weekNumber} 스케줄 생성 실패:`, scheduleError)
        continue
      }

      schedules.push(schedule)
    }

    console.log(`투표 스케줄 생성 완료: ${schedules.length}개`)

    return NextResponse.json({
      success: true,
      schedules: schedules,
      message: `${schedules.length}개의 투표 스케줄이 생성되었습니다.`
    })

  } catch (error) {
    console.error('투표 스케줄 생성 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// 주차 번호 계산 함수
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 특정 주차의 특정 요일 날짜 계산 함수
function getDateOfWeek(weekNumber: number, year: number, dayOfWeek: number): Date {
  const firstDayOfYear = new Date(year, 0, 1)
  const firstWeekDay = firstDayOfYear.getDay()
  const daysToAdd = (weekNumber - 1) * 7 + (dayOfWeek - firstWeekDay)
  
  const targetDate = new Date(firstDayOfYear)
  targetDate.setDate(firstDayOfYear.getDate() + daysToAdd)
  
  return targetDate
}