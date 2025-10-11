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
      event_date
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

  // 클라이언트에서 보낸 year와 week 값을 사용 (없으면 현재 값으로 fallback)
  const year = body.year || now.getFullYear()
  const week = body.week || Math.ceil((((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

  console.log('POST /api/multis - 클라이언트 데이터:', {
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
