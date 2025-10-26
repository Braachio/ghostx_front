import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// POST - 이벤트 활성화/비활성화 토글
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const { eventId, isActive } = body

    if (!eventId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: '이벤트 ID와 활성화 상태가 필요합니다.' }, { status: 400 })
    }

    console.log('이벤트 활성화 상태 변경:', { eventId, isActive, userId: user.id })

    // 이벤트 존재 및 권한 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('id, author_id, title, is_active')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('이벤트 조회 실패:', eventError)
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 사용자 프로필에서 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('프로필 조회 실패:', profileError)
      return NextResponse.json({ error: '프로필 조회에 실패했습니다.' }, { status: 500 })
    }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'event_manager'
    const isOwner = event.author_id === user.id

    // 권한 확인
    if (!isAdmin && !isOwner) {
      console.log('권한 없음:', { userId: user.id, eventAuthorId: event.author_id, userRole: profile?.role })
      return NextResponse.json({ error: '이벤트 관리 권한이 없습니다.' }, { status: 403 })
    }

    // 이벤트 활성화 상태 업데이트
    const { data: updatedEvent, error: updateError } = await supabase
      .from('multis')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select('id, title, is_active')
      .single()

    if (updateError) {
      console.error('이벤트 상태 업데이트 실패:', updateError)
      return NextResponse.json({ error: '이벤트 상태 업데이트에 실패했습니다.' }, { status: 500 })
    }

    console.log('이벤트 상태 변경 성공:', { 
      eventId, 
      title: updatedEvent.title,
      isActive: updatedEvent.is_active 
    })

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: `이벤트가 ${isActive ? '활성화' : '비활성화'}되었습니다.`
    })

  } catch (error) {
    console.error('이벤트 상태 변경 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
