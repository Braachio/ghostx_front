import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      auto_voting_enabled, 
      voting_start_offset_days, 
      voting_duration_days,
      weeks_ahead = 2 // 몇 주 앞까지 스케줄 생성할지
    } = body

    // 1. 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, multi_day, multi_time, event_type')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 투표 스케줄을 설정할 수 있습니다.' }, { status: 403 })
    }

    if (event.event_type !== 'regular_schedule') {
      return NextResponse.json({ error: '정기 이벤트만 자동 투표 스케줄을 설정할 수 있습니다.' }, { status: 400 })
    }

    // 2. 이벤트 설정 업데이트
    const { error: updateError } = await supabase
      .from('multis')
      .update({
        auto_voting_enabled: auto_voting_enabled,
        voting_start_offset_days: voting_start_offset_days || 1,
        voting_duration_days: voting_duration_days || 3
      })
      .eq('id', id)

    if (updateError) {
      console.error('이벤트 설정 업데이트 실패:', updateError)
      return NextResponse.json({ error: '이벤트 설정 업데이트에 실패했습니다.' }, { status: 500 })
    }

    // 3. 자동 투표가 활성화된 경우 스케줄 생성
    if (auto_voting_enabled && event.multi_day && event.multi_day.length > 0) {
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentWeek = Math.ceil((((+currentDate - +new Date(currentYear, 0, 1)) / 86400000) + new Date(currentYear, 0, 1).getDay() + 1) / 7)
      
      // 요일명을 숫자로 변환
      const dayMapping: { [key: string]: number } = {
        '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
      }
      
      const dayName = event.multi_day[0] // 첫 번째 요일 사용
      const dayNumber = dayMapping[dayName] ?? 1 // 기본값: 월요일
      
      const startTime = event.multi_time || '20:30'
      
      // 미래 N주에 대한 투표 스케줄 생성
      for (let i = 0; i < weeks_ahead; i++) {
        const targetWeek = currentWeek + i
        const targetYear = currentYear
        
        // 만약 주차가 52를 넘으면 다음 해로
        if (targetWeek > 52) {
          const nextYear = targetYear + 1
          const adjustedWeek = targetWeek - 52
          
          const { error: scheduleError } = await supabase.rpc('create_voting_schedule_for_week', {
            p_regular_event_id: id,
            p_week_number: adjustedWeek,
            p_year: nextYear,
            p_event_day_of_week: dayNumber,
            p_start_time: startTime,
            p_voting_start_offset_days: voting_start_offset_days || 1,
            p_voting_duration_days: voting_duration_days || 3
          })
          
          if (scheduleError) {
            console.error(`투표 스케줄 생성 실패 (${nextYear}년 ${adjustedWeek}주차):`, scheduleError)
          }
        } else {
          const { error: scheduleError } = await supabase.rpc('create_voting_schedule_for_week', {
            p_regular_event_id: id,
            p_week_number: targetWeek,
            p_year: targetYear,
            p_event_day_of_week: dayNumber,
            p_start_time: startTime,
            p_voting_start_offset_days: voting_start_offset_days || 1,
            p_voting_duration_days: voting_duration_days || 3
          })
          
          if (scheduleError) {
            console.error(`투표 스케줄 생성 실패 (${targetYear}년 ${targetWeek}주차):`, scheduleError)
          }
        }
      }
    } else if (!auto_voting_enabled) {
      // 자동 투표가 비활성화된 경우 기존 스케줄 삭제
      const { error: deleteError } = await supabase
        .from('voting_schedules')
        .delete()
        .eq('regular_event_id', id)
      
      if (deleteError) {
        console.error('투표 스케줄 삭제 실패:', deleteError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: auto_voting_enabled ? '자동 투표 스케줄이 설정되었습니다.' : '자동 투표가 비활성화되었습니다.',
      auto_voting_enabled,
      voting_start_offset_days: voting_start_offset_days || 1,
      voting_duration_days: voting_duration_days || 3
    })

  } catch (error) {
    console.error('투표 스케줄 설정 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    // 투표 스케줄 조회
    const { data: schedules, error } = await supabase
      .from('voting_schedules')
      .select('*')
      .eq('regular_event_id', id)
      .order('voting_start_time', { ascending: true })
      .limit(10)

    if (error) {
      console.error('투표 스케줄 조회 실패:', error)
      return NextResponse.json({ error: '투표 스케줄 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      schedules: schedules || []
    })

  } catch (error) {
    console.error('투표 스케줄 조회 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
