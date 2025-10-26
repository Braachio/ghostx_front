import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// POST /api/regular-events/[id]/vote - 투표하기
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    console.log('투표 요청:', { regularEventId: id, body })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('투표 실패 - 인증 오류')
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    console.log('인증된 사용자:', { userId: user.id, email: user.email })

    // 참가자 확인
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      console.log('투표 실패 - 참가자 아님')
      return NextResponse.json({ error: '참가 신청 후 투표할 수 있습니다.' }, { status: 403 })
    }

    // 투표 옵션 ID 검증
    const { track_option_id } = body

    if (!track_option_id) {
      return NextResponse.json({ error: '트랙을 선택해주세요.' }, { status: 400 })
    }

    // 투표 옵션이 존재하는지 확인
    const { data: trackOption, error: optionError } = await supabase
      .from('regular_event_vote_options')
      .select('id, option_value, voting_closed')
      .eq('id', track_option_id)
      .eq('regular_event_id', id)
      .eq('option_type', 'track')
      .single()

    if (optionError || !trackOption) {
      console.log('투표 실패 - 유효하지 않은 옵션')
      return NextResponse.json({ error: '유효하지 않은 투표 옵션입니다.' }, { status: 400 })
    }

    // 투표가 종료되었는지 확인 (voting_closed 필드가 있는 경우만)
    if (trackOption.voting_closed === true) {
      console.log('투표 실패 - 투표 종료됨')
      return NextResponse.json({ error: '투표가 종료되었습니다.' }, { status: 400 })
    }

    // 현재 주차와 연도 계산
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentWeek = Math.ceil((((+currentDate - +new Date(currentDate.getFullYear(), 0, 1)) / 86400000) + new Date(currentDate.getFullYear(), 0, 1).getDay() + 1) / 7)

    // 기존 투표 확인 및 업데이트/삽입
    const { data: existingVote, error: existingVoteError } = await supabase
      .from('regular_event_votes')
      .select('id, vote_option_id')
      .eq('regular_event_id', id)
      .eq('user_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    if (existingVoteError && existingVoteError.code !== 'PGRST116') {
      console.error('기존 투표 확인 오류:', existingVoteError)
      return NextResponse.json({ error: '투표 상태 확인 중 오류가 발생했습니다.' }, { status: 500 })
    }

    let result
    if (existingVote) {
      // 기존 투표 업데이트
      const { data: updatedVote, error: updateError } = await supabase
        .from('regular_event_votes')
        .update({
          vote_option_id: track_option_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)
        .select()
        .single()

      if (updateError) {
        console.error('투표 업데이트 실패:', updateError)
        return NextResponse.json({ error: '투표 업데이트에 실패했습니다.' }, { status: 500 })
      }

      result = updatedVote
      console.log('투표 업데이트 성공:', { voteId: updatedVote.id, trackOption: trackOption.option_value })
    } else {
      // 새 투표 생성
      const { data: newVote, error: insertError } = await supabase
        .from('regular_event_votes')
        .insert({
          regular_event_id: id,
          user_id: user.id,
          vote_option_id: track_option_id,
          week_number: currentWeek,
          year: currentYear
        })
        .select()
        .single()

      if (insertError) {
        console.error('투표 생성 실패:', insertError)
        return NextResponse.json({ error: '투표 생성에 실패했습니다.' }, { status: 500 })
      }

      result = newVote
      console.log('투표 생성 성공:', { voteId: newVote.id, trackOption: trackOption.option_value })
    }

    return NextResponse.json({
      success: true,
      vote: result,
      message: '투표가 완료되었습니다.'
    })

  } catch (error) {
    console.error('투표 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// GET /api/regular-events/[id]/vote - 투표 상태 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    console.log('투표 상태 조회:', { regularEventId: id })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 투표 옵션 조회
    const { data: trackOptions, error: optionsError } = await supabase
      .from('regular_event_vote_options')
      .select('id, option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('option_type', 'track')
      .order('votes_count', { ascending: false })

    if (optionsError) {
      console.error('투표 옵션 조회 실패:', optionsError)
      return NextResponse.json({ error: '투표 옵션을 불러올 수 없습니다.' }, { status: 500 })
    }

    // 사용자의 기존 투표 조회
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentWeek = Math.ceil((((+currentDate - +new Date(currentDate.getFullYear(), 0, 1)) / 86400000) + new Date(currentDate.getFullYear(), 0, 1).getDay() + 1) / 7)

    const { data: userVote, error: voteError } = await supabase
      .from('regular_event_votes')
      .select('id, vote_option_id')
      .eq('regular_event_id', id)
      .eq('user_id', user.id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single()

    if (voteError && voteError.code !== 'PGRST116') {
      console.error('사용자 투표 조회 실패:', voteError)
      return NextResponse.json({ error: '투표 상태를 불러올 수 없습니다.' }, { status: 500 })
    }

    // 참가자 수 조회
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id', { count: 'exact' })
      .eq('event_id', id)

    if (participantsError) {
      console.error('참가자 수 조회 실패:', participantsError)
    }

    // 투표 스케줄 조회 (수동 투표 관리로 변경되어 사용하지 않음)
    // const { data: schedule, error: scheduleError } = await supabase
    //   .from('vote_schedules')
    //   .select('voting_start, voting_end, is_active')
    //   .eq('regular_event_id', id)
    //   .eq('is_active', true)
    //   .lte('voting_start', now.toISOString())
    //   .gte('voting_end', now.toISOString())
    //   .single()

    return NextResponse.json({
      trackOptions: trackOptions || [],
      userVote: userVote ? { id: userVote.id, track_option_id: userVote.vote_option_id } : null,
      participantCount: participants?.length || 0,
      votingOpen: true, // 수동 투표 관리로 변경
      currentWeek,
      currentYear
    })

  } catch (error) {
    console.error('투표 상태 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
