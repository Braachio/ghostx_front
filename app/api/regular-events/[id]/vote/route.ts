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
      .from('participants')
      .select('id, event_id, user_id')
      .eq('event_id', id)
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

    // 3. 투표가 종료되었는지 확인
    const { data: votingStatus, error: votingStatusError } = await supabase
      .from('regular_event_vote_options')
      .select('voting_closed')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .limit(1)

    if (!votingStatusError && votingStatus && votingStatus.length > 0 && votingStatus[0].voting_closed) {
      return NextResponse.json({ 
        error: '투표가 종료되어 더 이상 투표할 수 없습니다.' 
      }, { status: 403 })
    }

    // 4. 투표 옵션이 유효한지 확인하고 없으면 생성
    let trackOption, carClassOption
    
    // 트랙 옵션 확인 및 생성
    if (track_option) {
      console.log('트랙 옵션 처리 시작:', track_option)
      
      // 먼저 기존 옵션 확인
      const { data: existingTrackOption, error: trackError } = await supabase
        .from('regular_event_vote_options')
        .select('id')
        .eq('regular_event_id', id)
        .eq('option_type', 'track')
        .eq('option_value', track_option)
        .eq('week_number', currentWeek)
        .eq('year', currentYear)
        .single()

      if (trackError && trackError.code === 'PGRST116') {
        // 트랙 옵션이 없으면 생성
        console.log('트랙 옵션 생성:', track_option)
        const { data: newTrackOption, error: createTrackError } = await supabase
          .from('regular_event_vote_options')
          .insert({
            regular_event_id: id,
            option_type: 'track',
            option_value: track_option,
            week_number: currentWeek,
            year: currentYear,
            votes_count: 0
          })
          .select('id')
          .single()
        
        if (createTrackError) {
          console.error('트랙 옵션 생성 실패:', createTrackError)
          // 생성 실패 시 다시 조회 시도 (다른 프로세스에서 생성했을 수 있음)
          const { data: retryTrackOption, error: retryError } = await supabase
            .from('regular_event_vote_options')
            .select('id')
            .eq('regular_event_id', id)
            .eq('option_type', 'track')
            .eq('option_value', track_option)
            .eq('week_number', currentWeek)
            .eq('year', currentYear)
            .single()
          
          if (retryError) {
            console.error('트랙 옵션 재조회도 실패:', retryError)
            return NextResponse.json({ 
              error: '트랙 옵션을 처리할 수 없습니다.' 
            }, { status: 500 })
          }
          trackOption = retryTrackOption
        } else {
          trackOption = newTrackOption
        }
      } else if (trackError) {
        console.error('트랙 옵션 확인 실패:', trackError)
        return NextResponse.json({ 
          error: '트랙 옵션 확인에 실패했습니다.' 
        }, { status: 500 })
      } else {
        trackOption = existingTrackOption
      }
      
      console.log('트랙 옵션 처리 완료:', trackOption?.id)
    }

    // 차량 클래스 옵션 확인 및 생성
    if (car_class_option) {
      console.log('차량 클래스 옵션 처리 시작:', car_class_option)
      
      // 먼저 기존 옵션 확인
      const { data: existingCarClassOption, error: carClassError } = await supabase
        .from('regular_event_vote_options')
        .select('id')
        .eq('regular_event_id', id)
        .eq('option_type', 'car_class')
        .eq('option_value', car_class_option)
        .eq('week_number', currentWeek)
        .eq('year', currentYear)
        .single()

      if (carClassError && carClassError.code === 'PGRST116') {
        // 차량 클래스 옵션이 없으면 생성
        console.log('차량 클래스 옵션 생성:', car_class_option)
        const { data: newCarClassOption, error: createCarClassError } = await supabase
          .from('regular_event_vote_options')
          .insert({
            regular_event_id: id,
            option_type: 'car_class',
            option_value: car_class_option,
            week_number: currentWeek,
            year: currentYear,
            votes_count: 0
          })
          .select('id')
          .single()
        
        if (createCarClassError) {
          console.error('차량 클래스 옵션 생성 실패:', createCarClassError)
          // 생성 실패 시 다시 조회 시도 (다른 프로세스에서 생성했을 수 있음)
          const { data: retryCarClassOption, error: retryError } = await supabase
            .from('regular_event_vote_options')
            .select('id')
            .eq('regular_event_id', id)
            .eq('option_type', 'car_class')
            .eq('option_value', car_class_option)
            .eq('week_number', currentWeek)
            .eq('year', currentYear)
            .single()
          
          if (retryError) {
            console.error('차량 클래스 옵션 재조회도 실패:', retryError)
            return NextResponse.json({ 
              error: '차량 클래스 옵션을 처리할 수 없습니다.' 
            }, { status: 500 })
          }
          carClassOption = retryCarClassOption
        } else {
          carClassOption = newCarClassOption
        }
      } else if (carClassError) {
        console.error('차량 클래스 옵션 확인 실패:', carClassError)
        return NextResponse.json({ 
          error: '차량 클래스 옵션 확인에 실패했습니다.' 
        }, { status: 500 })
      } else {
        carClassOption = existingCarClassOption
      }
      
      console.log('차량 클래스 옵션 처리 완료:', carClassOption?.id)
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

    // 5. 투표 수 업데이트
    console.log('투표 수 업데이트 시작')
    
    // 트랙 투표 수 업데이트
    const { data: trackVoteCount } = await supabase
      .from('regular_event_votes')
      .select('id', { count: 'exact' })
      .eq('regular_event_id', id)
      .eq('track_option', track_option)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)

    await supabase
      .from('regular_event_vote_options')
      .update({ votes_count: trackVoteCount?.length || 0 })
      .eq('id', trackOption.id)

    // 차량 클래스 투표 수 업데이트
    const { data: carClassVoteCount } = await supabase
      .from('regular_event_votes')
      .select('id', { count: 'exact' })
      .eq('regular_event_id', id)
      .eq('car_class_option', car_class_option)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)

    await supabase
      .from('regular_event_vote_options')
      .update({ votes_count: carClassVoteCount?.length || 0 })
      .eq('id', carClassOption.id)

    console.log('투표 수 업데이트 완료')

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
      .from('participants')
      .select('id', { count: 'exact' })
      .eq('event_id', id)

    // 투표 종료 상태 확인
    const { data: votingStatus } = await supabase
      .from('regular_event_vote_options')
      .select('voting_closed')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .limit(1)

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
      votingClosed: votingStatus && votingStatus.length > 0 ? votingStatus[0].voting_closed : false,
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
