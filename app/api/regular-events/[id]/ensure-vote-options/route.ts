import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 투표 옵션을 미리 생성하는 API
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
    const { track_option, car_class_option, week_number, year } = body

    // 현재 주차 정보
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    console.log('투표 옵션 미리 생성:', { 
      regularEventId: id, 
      track_option, 
      car_class_option, 
      currentWeek, 
      currentYear 
    })

    const results = []

    // 트랙 옵션 생성
    if (track_option) {
      const { data: trackOption, error: trackError } = await supabase
        .from('regular_event_vote_options')
        .upsert({
          regular_event_id: id,
          option_type: 'track',
          option_value: track_option,
          week_number: currentWeek,
          year: currentYear,
          votes_count: 0
        }, {
          onConflict: 'regular_event_id,option_type,option_value,week_number,year'
        })
        .select('id')
        .single()

      if (trackError) {
        console.error('트랙 옵션 생성 실패:', trackError)
        results.push({ type: 'track', error: trackError.message })
      } else {
        console.log('트랙 옵션 생성 성공:', trackOption.id)
        results.push({ type: 'track', success: true, id: trackOption.id })
      }
    }

    // 차량 클래스 옵션 생성
    if (car_class_option) {
      const { data: carClassOption, error: carClassError } = await supabase
        .from('regular_event_vote_options')
        .upsert({
          regular_event_id: id,
          option_type: 'car_class',
          option_value: car_class_option,
          week_number: currentWeek,
          year: currentYear,
          votes_count: 0
        }, {
          onConflict: 'regular_event_id,option_type,option_value,week_number,year'
        })
        .select('id')
        .single()

      if (carClassError) {
        console.error('차량 클래스 옵션 생성 실패:', carClassError)
        results.push({ type: 'car_class', error: carClassError.message })
      } else {
        console.log('차량 클래스 옵션 생성 성공:', carClassOption.id)
        results.push({ type: 'car_class', success: true, id: carClassOption.id })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: '투표 옵션이 준비되었습니다.'
    })

  } catch (error) {
    console.error('투표 옵션 생성 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
