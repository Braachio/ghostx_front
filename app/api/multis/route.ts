// /app/api/multis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { hasEventManagementPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    console.log('=== /api/multis GET 요청 시작 ===')
    console.log('요청 URL:', req.url)
    console.log('요청 시간:', new Date().toISOString())
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

    // 필요한 필드만 선택하여 최적화
    let query = supabase.from('multis').select(`
      id,
      title,
      description,
      game,
      game_track,
      multi_class,
      multi_day,
      multi_time,
      duration_hours,
      is_open,
      author_id,
      link,
      voting_enabled,
      created_at,
      event_type,
      event_date
    `)

    if (start && end) {
      query = query.gte('created_at', start).lte('created_at', end)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    console.log('=== /api/multis 디버깅 정보 ===')
    console.log('데이터 개수:', data?.length || 0)
    console.log('에러:', error?.message || '없음')
    console.log('첫 번째 아이템:', data?.[0] || '없음')
    
    // 게임 필드 값들 확인
    if (data && data.length > 0) {
      const gameValues = [...new Set(data.map(event => event.game))]
      console.log('실제 게임 필드 값들:', gameValues)
      
      // 각 게임별 개수 확인
      gameValues.forEach(game => {
        const count = data.filter(event => event.game === game).length
        console.log(`${game}: ${count}개`)
      })
    }
    
    console.log('전체 데이터:', data)
    console.log('===============================')

    if (error) {
      console.error('Supabase 에러:', error)
      console.error('에러 상세:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
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
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
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
    // 정기 이벤트 생성 권한 확인
    const hasPermission = await hasEventManagementPermission(user.id)
    
    if (!hasPermission) {
      return NextResponse.json({ error: '정기 이벤트 생성 권한이 없습니다. 관리자나 방장만 생성할 수 있습니다.' }, { status: 403 })
    }
    // 1. 먼저 multis 테이블에 기본 이벤트 정보 등록
    const { data: eventData, error: insertError } = await supabase.from('multis').insert({
      title: body.title,
      description: body.description,
      game: body.game,
      game_track: 'TBD', // 정기 이벤트는 주차별로 다름
      multi_class: 'TBD', // 정기 이벤트는 주차별로 다름
      multi_day: [body.day_of_week],
      multi_time: body.start_time,
      duration_hours: body.duration_hours,
      max_participants: 50, // 정기 이벤트는 기본값으로 50명 설정
      link: body.link,
      voting_enabled: body.voting_enabled || false,
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
    if (body.voting_enabled && body.track_options && body.track_options.length > 0) {
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

      const { error: optionsError } = await supabase
        .from('vote_options')
        .insert(trackOptions)

      if (optionsError) {
        console.error('투표 옵션 저장 실패:', optionsError)
        // 투표 옵션 저장 실패해도 이벤트는 생성된 상태
      } else {
        console.log('투표 옵션 저장 성공:', trackOptions.length, '개')
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
    event_date: body.event_date, // event_date 명시적으로 포함
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH - 이벤트 수정 (ON/OFF 토글 등)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '이벤트 ID가 필요합니다' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 이벤트 소유자 확인
    const { data: event, error: fetchError } = await supabase
      .from('multis')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (event.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 이벤트 업데이트
    const { error: updateError } = await supabase
      .from('multis')
      .update(body)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/multis 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
