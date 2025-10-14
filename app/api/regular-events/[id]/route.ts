import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 정기 이벤트 정보 수정
export async function PATCH(
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

    // 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, event_type')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 수정할 수 있습니다.' }, { status: 403 })
    }

    if (event.event_type !== 'regular_schedule') {
      return NextResponse.json({ error: '정기 이벤트만 수정할 수 있습니다.' }, { status: 400 })
    }

    // 수정 가능한 필드들만 업데이트
    const allowedFields = [
      'title',
      'description',
      'multi_day',
      'start_time',
      'duration_hours',
      'max_participants',
      'is_open'
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

    // 이벤트 정보 업데이트
    const { data: updatedEvent, error: updateError } = await supabase
      .from('multis')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: '이벤트 정보가 수정되었습니다.',
      event: updatedEvent
    })

  } catch (error) {
    console.error('이벤트 수정 실패:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
