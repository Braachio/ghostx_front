import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { hasEventManagementPermission } from '@/lib/permissions'

// 정기 이벤트 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('정기 이벤트 삭제 요청 - ID:', id)
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('사용자 인증 상태:', user ? '인증됨' : '미인증')

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 이벤트 관리 권한 확인
    const hasPermission = await hasEventManagementPermission(user.id, id)
    
    if (!hasPermission) {
      console.log('권한 없음 - 이벤트 관리 권한이 없음')
      return NextResponse.json({ error: '이벤트 관리 권한이 없습니다.' }, { status: 403 })
    }

    // 이벤트 존재 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, event_type, title')
      .eq('id', id)
      .single()

    console.log('이벤트 조회 결과:', { event, eventError })

    if (eventError) {
      console.error('이벤트 조회 에러:', eventError)
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!event) {
      console.log('이벤트가 존재하지 않음')
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    console.log('이벤트 정보:', { author_id: event.author_id, event_type: event.event_type, user_id: user.id })

    if (event.event_type !== 'regular_schedule') {
      console.log('잘못된 이벤트 타입:', event.event_type)
      return NextResponse.json({ error: '정기 이벤트만 삭제할 수 있습니다.' }, { status: 400 })
    }

    // 관련 데이터 삭제 (투표 옵션, 투표, 스케줄 등)
    console.log('관련 데이터 삭제 시작...')
    
    // 1. 투표 옵션 삭제
    const { error: voteOptionsError } = await supabase
      .from('regular_event_vote_options')
      .delete()
      .eq('regular_event_id', id)

    if (voteOptionsError) {
      console.error('투표 옵션 삭제 실패:', voteOptionsError)
    }

    // 2. 투표 삭제
    const { error: votesError } = await supabase
      .from('regular_event_votes')
      .delete()
      .eq('regular_event_id', id)

    if (votesError) {
      console.error('투표 삭제 실패:', votesError)
    }

    // 3. 투표 스케줄 삭제
    const { error: schedulesError } = await supabase
      .from('voting_schedules')
      .delete()
      .eq('regular_event_id', id)

    if (schedulesError) {
      console.error('투표 스케줄 삭제 실패:', schedulesError)
    }

    // 4. 참가자 삭제
    const { error: participantsError } = await supabase
      .from('participants')
      .delete()
      .eq('event_id', id)

    if (participantsError) {
      console.error('참가자 삭제 실패:', participantsError)
    }

    // 5. 이벤트 삭제
    const { error: deleteError } = await supabase
      .from('multis')
      .delete()
      .eq('id', id)

    console.log('이벤트 삭제 결과:', { deleteError })

    if (deleteError) {
      console.error('이벤트 삭제 실패:', deleteError)
      throw deleteError
    }

    console.log('이벤트 삭제 성공')
    return NextResponse.json({
      success: true,
      message: `"${event.title}" 이벤트가 삭제되었습니다.`
    })

  } catch (error) {
    console.error('이벤트 삭제 실패:', error)
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 정기 이벤트 정보 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('정기 이벤트 수정 요청 - ID:', id)
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('사용자 인증 상태:', user ? '인증됨' : '미인증')

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    console.log('수정 요청 데이터:', body)

    // 이벤트 관리 권한 확인
    const hasPermission = await hasEventManagementPermission(user.id, id)
    
    if (!hasPermission) {
      console.log('권한 없음 - 이벤트 관리 권한이 없음')
      return NextResponse.json({ error: '이벤트 관리 권한이 없습니다.' }, { status: 403 })
    }

    // 이벤트 존재 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, event_type')
      .eq('id', id)
      .single()

    console.log('이벤트 조회 결과:', { event, eventError })

    if (eventError) {
      console.error('이벤트 조회 에러:', eventError)
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (!event) {
      console.log('이벤트가 존재하지 않음')
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    console.log('이벤트 정보:', { author_id: event.author_id, event_type: event.event_type, user_id: user.id })

    if (event.event_type !== 'regular_schedule') {
      console.log('잘못된 이벤트 타입:', event.event_type)
      return NextResponse.json({ error: '정기 이벤트만 수정할 수 있습니다.' }, { status: 400 })
    }

    // 수정 가능한 필드들만 업데이트
    const allowedFields = [
      'title',
      'description',
      'multi_day',
      'multi_time',
      'duration_hours',
      'max_participants',
      'is_open',
      'link',
      'game_track',
      'multi_class'
    ]

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // 허용된 필드만 업데이트 데이터에 포함
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    console.log('업데이트할 데이터:', updateData)

    // 이벤트 정보 업데이트
    const { data: updatedEvent, error: updateError } = await supabase
      .from('multis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    console.log('업데이트 결과:', { updatedEvent, updateError })

    if (updateError) {
      console.error('업데이트 에러:', updateError)
      throw updateError
    }

    console.log('이벤트 수정 성공')
    return NextResponse.json({
      success: true,
      message: '이벤트 정보가 수정되었습니다.',
      event: updatedEvent
    })

  } catch (error) {
    console.error('이벤트 수정 실패:', error)
    console.error('에러 스택:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
