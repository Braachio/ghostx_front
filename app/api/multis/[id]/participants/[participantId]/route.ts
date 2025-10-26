import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// PATCH /api/multis/[id]/participants/[participantId] - 참가자 상태 변경
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id, participantId } = await params
    const body = await req.json()

    console.log(`참가자 상태 변경 요청 - Event ID: ${id}, Participant ID: ${participantId}, Body:`, body)

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('참가자 상태 변경 실패 - 인증 오류')
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      console.log('참가자 상태 변경 실패 - 이벤트를 찾을 수 없음')
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 작성자 또는 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = event.author_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      console.log('참가자 상태 변경 실패 - 권한 없음')
      return NextResponse.json({ error: '이벤트 작성자 또는 관리자만 참가자 상태를 변경할 수 있습니다.' }, { status: 403 })
    }

    // 유효한 상태인지 확인
    const validStatuses = ['confirmed', 'pending']
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다. (confirmed, pending)' }, { status: 400 })
    }

    // 참가자 상태 업데이트
    const { data: updatedParticipant, error: updateError } = await supabase
      .from('participants')
      .update({
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId)
      .eq('event_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('참가자 상태 업데이트 실패:', updateError)
      return NextResponse.json({ error: '참가자 상태 변경에 실패했습니다.' }, { status: 500 })
    }

    console.log('참가자 상태 변경 성공:', updatedParticipant)
    return NextResponse.json({ 
      success: true, 
      message: '참가자 상태가 변경되었습니다.',
      participant: updatedParticipant
    })

  } catch (error) {
    console.error('참가자 상태 변경 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
