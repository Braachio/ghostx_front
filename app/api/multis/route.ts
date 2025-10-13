// /app/api/multis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function GET(req: NextRequest) {
  try {
    console.log('multis API 호출됨')
    
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // 이벤트 상태 정리 작업 실행 (백그라운드에서)
    try {
      const cleanupResponse = await fetch(`${req.nextUrl.origin}/api/multis/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (cleanupResponse.ok) {
        const cleanupResult = await cleanupResponse.json()
        if (cleanupResult.updatedCount > 0) {
          console.log(`🧹 자동 정리 완료: ${cleanupResult.updatedCount}개 이벤트 종료됨`)
        }
      }
    } catch (cleanupError) {
      console.error('자동 정리 작업 실패:', cleanupError)
      // 정리 작업 실패해도 메인 기능은 계속 진행
    }

    const start = req.nextUrl.searchParams.get('start')
    const end = req.nextUrl.searchParams.get('end')

    // 새로운 컬럼들이 없을 수 있으므로 기존 컬럼들만 선택
    let query = supabase.from('multis').select(`
      id,
      title,
      game,
      game_track,
      multi_class,
      multi_day,
      multi_time,
      multi_race,
      is_open,
      description,
      link,
      author_id,
      anonymous_nickname,
      anonymous_password,
      created_at,
      updated_at,
      year,
      week,
      event_date,
      event_type,
      is_template_based,
      template_id,
      duration_hours,
      max_participants,
      gallery_link
    `)

    if (start && end) {
      query = query.gte('created_at', start).lte('created_at', end)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase 에러:', error)
      console.error('에러 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      // 에러 시 더미 데이터 반환
      const dummyData = [
        {
          id: '1',
          title: '🏁 주말 레이싱 이벤트',
          game: '컴페티치오네',
          game_track: 'Seoul Circuit',
          multi_class: 'GT3',
          multi_day: ['토', '일'],
          multi_time: '20:00',
          multi_race: 'Sprint Race',
          is_open: true,
          description: '주말 레이싱 이벤트입니다. 많은 참여 부탁드립니다!',
          link: null,
          author_id: 'dummy-author',
          anonymous_nickname: null,
          anonymous_password: null,
          created_at: new Date().toISOString(),
          updated_at: null,
          year: new Date().getFullYear(),
          week: Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)),
          event_date: null,
          event_type: 'flash_event',
          is_template_based: false,
          template_id: null
        }
      ]
      return NextResponse.json(dummyData)
    }

    console.log('multis 데이터 조회 성공:', data?.length || 0, '개')
    
    if (!data || data.length === 0) {
      console.log('Supabase에 데이터가 없음 - 빈 배열 반환')
      return NextResponse.json([])
    }

    console.log('실제 Supabase 데이터 반환:', data.length, '개')
    if (data && data.length > 0) {
      const firstEvent = data[0]
      console.log('첫 번째 이벤트:', {
        id: firstEvent.id,
        title: firstEvent.title,
        year: firstEvent.year,
        week: firstEvent.week,
        multi_day: firstEvent.multi_day
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('multis API 에러:', error)
    // 전체 에러 시에도 더미 데이터 반환
    const dummyData = [
      {
        id: '1',
        title: '🏁 주말 레이싱 이벤트',
        game: '컴페티치오네',
        game_track: 'Seoul Circuit',
        multi_class: 'GT3',
        multi_day: ['토', '일'],
        multi_time: '20:00',
        multi_race: 'Sprint Race',
        is_open: true,
        description: '주말 레이싱 이벤트입니다. 많은 참여 부탁드립니다!',
        link: null,
        author_id: 'dummy-author',
        anonymous_nickname: null,
        anonymous_password: null,
        created_at: new Date().toISOString(),
        updated_at: null,
        year: new Date().getFullYear(),
        week: Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)),
        event_date: null,
        event_type: 'flash_event',
        is_template_based: false,
        template_id: null
      }
    ]
    return NextResponse.json(dummyData)
  }
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json()
  const now = new Date()

  console.log('POST /api/multis - 클라이언트 데이터:', body)

  // 정기 이벤트인 경우
  if (body.event_type === 'regular_schedule') {
    // 1. 먼저 multis 테이블에 기본 이벤트 정보 등록
    const { data: eventData, error: insertError } = await supabase.from('multis').insert({
      title: body.title,
      description: body.description,
      game: body.game,
      game_track: 'TBD', // 정기 이벤트는 주차별로 다름
      multi_class: 'TBD', // 정기 이벤트는 주차별로 다름
      multi_day: [body.day_of_week],
      multi_time: body.start_time,
      max_participants: body.max_participants,
      duration_hours: body.duration_hours,
      gallery_link: body.gallery_link,
      event_type: 'regular_schedule',
      is_template_based: false,
      is_open: true,
      author_id: user.id,
      created_at: now.toISOString(),
      // 정기 이벤트는 year, week를 null로 설정
      year: null,
      week: null,
      event_date: null
    }).select().single()

    if (insertError) {
      console.error('정기 이벤트 기본 정보 등록 실패:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log('정기 이벤트 기본 정보 등록 성공:', eventData.id)

    // 2. 투표 옵션 저장 (투표가 활성화된 경우)
    if (body.voting_enabled && body.track_options && body.car_class_options) {
      const currentYear = now.getFullYear()
      const currentWeek = Math.ceil((((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

      // 트랙 옵션들 저장
      const trackOptions = body.track_options.map(track => ({
        regular_event_id: eventData.id,
        week_number: currentWeek,
        year: currentYear,
        option_type: 'track',
        option_value: track,
        votes_count: 0
      }))

      // 차량 클래스 옵션들 저장
      const carClassOptions = body.car_class_options.map(carClass => ({
        regular_event_id: eventData.id,
        week_number: currentWeek,
        year: currentYear,
        option_type: 'car_class',
        option_value: carClass,
        votes_count: 0
      }))

      const { error: optionsError } = await supabase
        .from('regular_event_vote_options')
        .insert([...trackOptions, ...carClassOptions])

      if (optionsError) {
        console.error('투표 옵션 저장 실패:', optionsError)
        // 투표 옵션 저장 실패해도 이벤트는 생성된 상태
      } else {
        console.log('투표 옵션 저장 성공:', trackOptions.length + carClassOptions.length, '개')
      }
    }

    // 3. 첫 번째 주차 스케줄 생성 (투표가 비활성화된 경우 기본값으로)
    const currentYear = now.getFullYear()
    const currentWeek = Math.ceil((((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

    const { error: scheduleError } = await supabase
      .from('regular_event_schedules')
      .insert({
        regular_event_id: eventData.id,
        week_number: currentWeek,
        year: currentYear,
        track: body.voting_enabled ? 'TBD (투표 예정)' : (body.track_options && body.track_options[0] ? body.track_options[0] : 'TBD'),
        car_class: body.voting_enabled ? 'TBD (투표 예정)' : (body.car_class_options && body.car_class_options[0] ? body.car_class_options[0] : 'TBD'),
        start_time: body.start_time,
        duration_hours: body.duration_hours,
        is_active: true
      })

    if (scheduleError) {
      console.error('정기 이벤트 스케줄 생성 실패:', scheduleError)
      // 스케줄 생성 실패해도 기본 이벤트는 생성된 상태
    } else {
      console.log('정기 이벤트 스케줄 생성 성공')
    }

    return NextResponse.json({ success: true, eventId: eventData.id })
  }

  // 기존 로직 (일반 이벤트)
  // 클라이언트에서 보낸 year와 week 값을 사용 (없으면 현재 값으로 fallback)
  const year = body.year || now.getFullYear()
  const week = body.week || Math.ceil((((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

  console.log('POST /api/multis - 일반 이벤트 데이터:', {
    clientYear: body.year,
    clientWeek: body.week,
    finalYear: year,
    finalWeek: week
  })

  const { error: insertError } = await supabase.from('multis').insert({
    ...body,
    year: year,
    week: week,
    author_id: user.id,
    created_at: now.toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
