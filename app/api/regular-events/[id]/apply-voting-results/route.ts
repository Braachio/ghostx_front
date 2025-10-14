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

    // 3. 정기 이벤트에 투표 결과 적용 (TBD를 실제 값으로 업데이트)
    try {
      // 정기 이벤트의 game_track과 multi_class를 투표 결과로 업데이트
      const { data: updatedEvent, error: updateError } = await supabase
        .from('multis')
        .update({
          game_track: winningTrack,
          multi_class: winningCarClass,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('투표 결과 적용 실패:', updateError)
        return NextResponse.json({ error: '투표 결과 적용에 실패했습니다.' }, { status: 500 })
      }

      console.log('투표 결과 적용 성공:', {
        eventId: id,
        week_number,
        year,
        winningTrack,
        winningCarClass,
        updatedEvent: updatedEvent?.title
      })

      // 4. 트랙 히스토리에 기록 추가 (표준화된 트랙 명 사용)
      try {
        // 표준화된 트랙 명 가져오기
        const { data: trackMapping } = await supabase
          .from('track_name_mapping')
          .select('standardized_name')
          .eq('game_name', updatedEvent?.game || '')
          .eq('original_name', winningTrack)
          .single()

        const standardizedTrackName = trackMapping?.standardized_name || winningTrack

        const { error: historyError } = await supabase
          .from('regular_multi_track_history')
          .insert({
            regular_event_id: id,
            week_number,
            year,
            selected_track: winningTrack,
            selected_car_class: winningCarClass,
            game_name: updatedEvent?.game || '',
            standardized_track_name: standardizedTrackName
          })

        if (historyError) {
          console.error('트랙 히스토리 기록 실패:', historyError)
        } else {
          console.log('트랙 히스토리 기록 성공:', {
            eventId: id,
            track: winningTrack,
            standardizedTrack: standardizedTrackName,
            carClass: winningCarClass,
            week: week_number,
            year
          })
        }
      } catch (historyError) {
        console.error('트랙 히스토리 기록 중 오류:', historyError)
      }


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
