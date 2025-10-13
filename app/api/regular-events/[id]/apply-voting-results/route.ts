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
    const { week_number, year } = body

    if (!week_number || !year) {
      return NextResponse.json({ error: '주차와 연도 정보가 필요합니다.' }, { status: 400 })
    }

    // 1. 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, event_type, title')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 투표 결과를 적용할 수 있습니다.' }, { status: 403 })
    }

    if (event.event_type !== 'regular_schedule') {
      return NextResponse.json({ error: '정기 이벤트만 투표 결과를 적용할 수 있습니다.' }, { status: 400 })
    }

    // 2. 투표 결과 확인
    const { data: trackResults, error: trackError } = await supabase
      .from('regular_event_vote_options')
      .select('option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', week_number)
      .eq('year', year)
      .eq('option_type', 'track')
      .order('votes_count', { ascending: false })

    const { data: carClassResults, error: carClassError } = await supabase
      .from('regular_event_vote_options')
      .select('option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', week_number)
      .eq('year', year)
      .eq('option_type', 'car_class')
      .order('votes_count', { ascending: false })

    if (trackError || carClassError) {
      return NextResponse.json({ error: '투표 결과를 조회할 수 없습니다.' }, { status: 500 })
    }

    if (!trackResults || trackResults.length === 0 || !carClassResults || carClassResults.length === 0) {
      return NextResponse.json({ error: '투표 결과가 없습니다.' }, { status: 400 })
    }

    const winningTrack = trackResults[0].option_value
    const winningCarClass = carClassResults[0].option_value
    const trackVotes = trackResults[0].votes_count
    const carClassVotes = carClassResults[0].votes_count

    // 3. 투표 결과를 이벤트에 직접 적용 (데이터베이스 함수 대신 직접 처리)
    try {
      // 기존 정기 이벤트 정보 조회
      const { data: originalEvent, error: originalEventError } = await supabase
        .from('multis')
        .select('*')
        .eq('id', id)
        .single()

      if (originalEventError || !originalEvent) {
        console.error('원본 이벤트 조회 실패:', originalEventError)
        return NextResponse.json({ error: '원본 이벤트를 찾을 수 없습니다.' }, { status: 404 })
      }

      // 해당 주차의 요일 날짜 계산
      const dayMapping: { [key: string]: number } = {
        '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
      }
      
      const dayName = originalEvent.multi_day?.[0] || '월'
      const dayNumber = dayMapping[dayName] || 1
      
      // 해당 주차의 해당 요일 날짜 계산
      const eventDate = new Date(year, 0, 1)
      const firstDayOfYear = new Date(eventDate.getFullYear(), 0, 1)
      const daysToFirstMonday = (8 - firstDayOfYear.getDay()) % 7
      const firstMonday = new Date(firstDayOfYear.getTime() + daysToFirstMonday * 24 * 60 * 60 * 1000)
      const targetDate = new Date(firstMonday.getTime() + (week_number - 1) * 7 * 24 * 60 * 60 * 1000 + dayNumber * 24 * 60 * 60 * 1000)

      // 투표 결과가 적용된 이벤트 생성
      const { data: newEvent, error: insertError } = await supabase
        .from('multis')
        .insert({
          title: `${originalEvent.title} (${year}년 ${week_number}주차)`,
          description: originalEvent.description,
          game: originalEvent.game,
          game_track: winningTrack,
          multi_class: winningCarClass,
          multi_day: originalEvent.multi_day,
          multi_time: originalEvent.multi_time,
          max_participants: originalEvent.max_participants,
          duration_hours: originalEvent.duration_hours,
          gallery_link: originalEvent.gallery_link,
          event_type: 'flash_event',
          is_template_based: false,
          is_open: true,
          author_id: originalEvent.author_id,
          week: week_number,
          year: year,
          event_date: targetDate.toISOString().split('T')[0],
          auto_voting_enabled: false,
          voting_start_offset_days: null,
          voting_duration_days: null
        })
        .select()
        .single()

      if (insertError) {
        console.error('투표 결과 이벤트 생성 실패:', insertError)
        return NextResponse.json({ error: '투표 결과 적용에 실패했습니다.' }, { status: 500 })
      }

      console.log('투표 결과 적용 성공:', {
        eventId: id,
        week_number,
        year,
        winningTrack,
        winningCarClass,
        newEventId: newEvent?.id
      })

    } catch (applyError) {
      console.error('투표 결과 적용 중 오류:', applyError)
      return NextResponse.json({ error: '투표 결과 적용 중 오류가 발생했습니다.' }, { status: 500 })
    }

      return NextResponse.json({
        success: true,
        message: '투표 결과가 성공적으로 적용되었습니다.',
        results: {
          winningTrack,
          winningCarClass,
          trackVotes,
          carClassVotes,
          week_number,
          year
        }
      })

  } catch (error) {
    console.error('투표 결과 적용 API 오류:', error)
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
    const { searchParams } = new URL(req.url)
    const week_number = searchParams.get('week_number')
    const year = searchParams.get('year')

    if (!week_number || !year) {
      return NextResponse.json({ error: '주차와 연도 정보가 필요합니다.' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 투표 결과 조회
    const { data: trackResults, error: trackError } = await supabase
      .from('regular_event_vote_options')
      .select('option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', parseInt(week_number))
      .eq('year', parseInt(year))
      .eq('option_type', 'track')
      .order('votes_count', { ascending: false })

    const { data: carClassResults, error: carClassError } = await supabase
      .from('regular_event_vote_options')
      .select('option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', parseInt(week_number))
      .eq('year', parseInt(year))
      .eq('option_type', 'car_class')
      .order('votes_count', { ascending: false })

    if (trackError || carClassError) {
      return NextResponse.json({ error: '투표 결과를 조회할 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: {
        tracks: trackResults || [],
        carClasses: carClassResults || [],
        week_number: parseInt(week_number),
        year: parseInt(year)
      }
    })

  } catch (error) {
    console.error('투표 결과 조회 API 오류:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
