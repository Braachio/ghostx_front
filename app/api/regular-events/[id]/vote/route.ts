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
    const { track_option, car_class_option, week_number, year } = body

    // 현재 주차 정보 확인 (요청에서 받지 않은 경우)
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    // 1. 해당 정기 이벤트에 참가신청한 사용자인지 확인
    console.log('투표 권한 확인:', { regularEventId: id, userId: user.id })
    
    const { data: participant, error: participantError } = await supabase
      .from('multi_participants')
      .select('id, multi_id, user_id')
      .eq('multi_id', id)
      .eq('user_id', user.id)
      .single()

    console.log('참가자 확인 결과:', { participant, participantError })

    if (participantError || !participant) {
      console.log('투표 권한 없음:', { 
        hasParticipant: !!participant, 
        error: participantError?.message 
      })
      return NextResponse.json({ 
        error: '해당 이벤트에 참가신청한 사용자만 투표할 수 있습니다.' 
      }, { status: 403 })
    }

    // 2. 이미 투표한 사용자인지 확인
    const { data: existingVote } = await supabase
      .from('regular_event_votes')
      .select('id, track_option, car_class_option')
      .eq('regular_event_id', id)
      .eq('voter_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    // 3. 투표 옵션이 유효한지 확인
    const { data: trackOption, error: trackError } = await supabase
      .from('regular_event_vote_options')
      .select('id')
      .eq('regular_event_id', id)
      .eq('option_type', 'track')
      .eq('option_value', track_option)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    const { data: carClassOption, error: carClassError } = await supabase
      .from('regular_event_vote_options')
      .select('id')
      .eq('regular_event_id', id)
      .eq('option_type', 'car_class')
      .eq('option_value', car_class_option)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    if (trackError || carClassError || !trackOption || !carClassOption) {
      return NextResponse.json({ 
        error: '유효하지 않은 투표 옵션입니다.' 
      }, { status: 400 })
    }

    // 4. 투표 저장 또는 업데이트
    const voteData = {
      regular_event_id: id,
      week_number: currentWeek,
      year: currentYear,
      voter_id: user.id,
      track_option,
      car_class_option
    }

    let result
    if (existingVote) {
      // 기존 투표 업데이트
      const { data, error } = await supabase
        .from('regular_event_votes')
        .update(voteData)
        .eq('id', existingVote.id)
        .select()
        .single()

      result = data
      if (error) {
        console.error('투표 업데이트 실패:', error)
        return NextResponse.json({ error: '투표 업데이트에 실패했습니다.' }, { status: 500 })
      }
    } else {
      // 새로운 투표 생성
      const { data, error } = await supabase
        .from('regular_event_votes')
        .insert(voteData)
        .select()
        .single()

      result = data
      if (error) {
        console.error('투표 생성 실패:', error)
        return NextResponse.json({ error: '투표 생성에 실패했습니다.' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      vote: result,
      message: existingVote ? '투표가 업데이트되었습니다.' : '투표가 완료되었습니다.'
    })

  } catch (error) {
    console.error('투표 API 오류:', error)
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
    
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const week_number = parseInt(searchParams.get('week_number') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    // 현재 주차 정보
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    // 1. 투표 옵션들 가져오기
    const { data: voteOptions, error: optionsError } = await supabase
      .from('regular_event_vote_options')
      .select('option_type, option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .order('option_type, votes_count', { ascending: false })

    if (optionsError) {
      return NextResponse.json({ error: '투표 옵션을 불러오는데 실패했습니다.' }, { status: 500 })
    }

    // 2. 사용자의 현재 투표 확인
    const { data: userVote } = await supabase
      .from('regular_event_votes')
      .select('track_option, car_class_option')
      .eq('regular_event_id', id)
      .eq('voter_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    // 3. 참가자 수 확인
    const { data: participantCount } = await supabase
      .from('multi_participants')
      .select('id', { count: 'exact' })
      .eq('multi_id', id)

    // 옵션들을 타입별로 그룹화
    const trackOptions = voteOptions?.filter(option => option.option_type === 'track') || []
    const carClassOptions = voteOptions?.filter(option => option.option_type === 'car_class') || []

    return NextResponse.json({
      success: true,
      voteOptions: {
        tracks: trackOptions,
        carClasses: carClassOptions
      },
      userVote: userVote || null,
      participantCount: participantCount?.length || 0,
      weekInfo: {
        week: currentWeek,
        year: currentYear
      }
    })

  } catch (error) {
    console.error('투표 조회 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
