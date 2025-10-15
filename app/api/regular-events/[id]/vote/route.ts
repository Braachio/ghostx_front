import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== 새로운 투표 API 시작 ===')
    const { id } = await params
    console.log('정기 이벤트 ID:', id)
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('사용자 인증 실패')
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    console.log('사용자 ID:', user.id)

    const body = await req.json()
    const { track_option, car_class_option, week_number, year } = body
    console.log('요청 데이터:', { track_option, car_class_option, week_number, year })

    // 현재 주차 정보
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    console.log('현재 주차 정보:', { currentWeek, currentYear })

    // 투표할 옵션이 있는지 확인
    if (!track_option && !car_class_option) {
      console.error('투표할 옵션이 없습니다.')
      return NextResponse.json({ 
        error: '투표할 옵션을 선택해주세요.' 
      }, { status: 400 })
    }

    // 1. 참가자 확인
    console.log('참가자 확인 시작')
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      console.log('참가자 확인 실패:', participantError)
      return NextResponse.json({ 
        error: '해당 이벤트에 참가신청한 사용자만 투표할 수 있습니다.' 
      }, { status: 403 })
    }

    console.log('참가자 확인 완료')

    // 2. 투표 옵션 ID 찾기 또는 생성
    let trackOptionId = null
    let carClassOptionId = null

    if (track_option) {
      console.log('트랙 옵션 처리:', track_option)
      
      // 기존 옵션 찾기
      const { data: existingTrackOption, error: trackError } = await supabase
        .from('vote_options')
        .select('id')
        .eq('regular_event_id', id)
        .eq('option_type', 'track')
        .eq('option_value', track_option)
        .eq('week_number', currentWeek)
        .eq('year', currentYear)
        .single()

      if (trackError && trackError.code === 'PGRST116') {
        // 옵션이 없으면 생성
        console.log('트랙 옵션 생성:', track_option)
        const { data: newTrackOption, error: createError } = await supabase
          .from('vote_options')
          .insert({
            regular_event_id: id,
            option_type: 'track',
            option_value: track_option,
            week_number: currentWeek,
            year: currentYear
          })
          .select('id')
          .single()

        if (createError) {
          console.error('트랙 옵션 생성 실패:', createError)
          return NextResponse.json({ 
            error: '트랙 옵션 생성에 실패했습니다.' 
          }, { status: 500 })
        }
        trackOptionId = newTrackOption.id
      } else if (trackError) {
        console.error('트랙 옵션 확인 실패:', trackError)
        return NextResponse.json({ 
          error: '트랙 옵션 확인에 실패했습니다.' 
        }, { status: 500 })
      } else {
        trackOptionId = existingTrackOption.id
      }
      
      console.log('트랙 옵션 ID:', trackOptionId)
    }

    if (car_class_option) {
      console.log('차량 클래스 옵션 처리:', car_class_option)
      
      // 기존 옵션 찾기
      const { data: existingCarClassOption, error: carClassError } = await supabase
        .from('vote_options')
        .select('id')
        .eq('regular_event_id', id)
        .eq('option_type', 'car_class')
        .eq('option_value', car_class_option)
        .eq('week_number', currentWeek)
        .eq('year', currentYear)
        .single()

      if (carClassError && carClassError.code === 'PGRST116') {
        // 옵션이 없으면 생성
        console.log('차량 클래스 옵션 생성:', car_class_option)
        const { data: newCarClassOption, error: createError } = await supabase
          .from('vote_options')
          .insert({
            regular_event_id: id,
            option_type: 'car_class',
            option_value: car_class_option,
            week_number: currentWeek,
            year: currentYear
          })
          .select('id')
          .single()

        if (createError) {
          console.error('차량 클래스 옵션 생성 실패:', createError)
          return NextResponse.json({ 
            error: '차량 클래스 옵션 생성에 실패했습니다.' 
          }, { status: 500 })
        }
        carClassOptionId = newCarClassOption.id
      } else if (carClassError) {
        console.error('차량 클래스 옵션 확인 실패:', carClassError)
        return NextResponse.json({ 
          error: '차량 클래스 옵션 확인에 실패했습니다.' 
        }, { status: 500 })
      } else {
        carClassOptionId = existingCarClassOption.id
      }
      
      console.log('차량 클래스 옵션 ID:', carClassOptionId)
    }

    // 3. 기존 투표 확인
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id, track_option_id, car_class_option_id')
      .eq('regular_event_id', id)
      .eq('voter_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    console.log('기존 투표:', existingVote)

    // 4. 투표 저장 또는 업데이트
    const voteData = {
      regular_event_id: id,
      week_number: currentWeek,
      year: currentYear,
      voter_id: user.id,
      ...(trackOptionId && { track_option_id: trackOptionId }),
      ...(carClassOptionId && { car_class_option_id: carClassOptionId })
    }

    console.log('투표 데이터:', voteData)

    let result
    if (existingVote) {
      // 기존 투표 업데이트
      console.log('기존 투표 업데이트 시작:', existingVote.id)
      const { data, error } = await supabase
        .from('votes')
        .update(voteData)
        .eq('id', existingVote.id)
        .select()
        .single()

      console.log('투표 업데이트 결과:', { data, error })

      if (error) {
        console.error('투표 업데이트 실패:', error)
        return NextResponse.json({ error: '투표 업데이트에 실패했습니다.' }, { status: 500 })
      }
      result = data
    } else {
      // 새로운 투표 생성
      console.log('새로운 투표 생성 시작')
      const { data, error } = await supabase
        .from('votes')
        .insert(voteData)
        .select()
        .single()

      console.log('투표 생성 결과:', { data, error })

      if (error) {
        console.error('투표 생성 실패:', error)
        return NextResponse.json({ error: '투표 생성에 실패했습니다.' }, { status: 500 })
      }
      result = data
    }

    console.log('투표 처리 완료:', result.id)

    return NextResponse.json({ 
      success: true, 
      vote: result,
      message: existingVote ? '투표가 업데이트되었습니다.' : '투표가 완료되었습니다.'
    })

  } catch (error) {
    console.error('=== 투표 API 오류 ===')
    console.error('오류 타입:', typeof error)
    console.error('오류 객체:', error)
    console.error('오류 메시지:', error instanceof Error ? error.message : 'Unknown error')
    console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error : undefined
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
      .from('vote_options')
      .select('id, option_type, option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .order('option_type, votes_count', { ascending: false })

    if (optionsError) {
      return NextResponse.json({ error: '투표 옵션을 불러오는데 실패했습니다.' }, { status: 500 })
    }

    // 2. 사용자의 현재 투표 확인
    const { data: userVote } = await supabase
      .from('votes')
      .select(`
        id,
        track_option_id,
        car_class_option_id,
        track_option:track_option_id(id, option_value),
        car_class_option:car_class_option_id(id, option_value)
      `)
      .eq('regular_event_id', id)
      .eq('voter_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    // 3. 참가자 수 확인
    const { data: participantCount } = await supabase
      .from('participants')
      .select('id', { count: 'exact' })
      .eq('event_id', id)

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