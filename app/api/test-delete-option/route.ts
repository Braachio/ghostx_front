import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// 테스트용 간단한 삭제 API
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const { searchParams } = new URL(req.url)
    const optionId = searchParams.get('optionId')
    const eventId = searchParams.get('eventId')

    console.log('테스트 삭제 API 호출:', { optionId, eventId })

    if (!optionId || !eventId) {
      return NextResponse.json({ error: 'optionId와 eventId가 필요합니다.' }, { status: 400 })
    }

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('테스트 삭제 실패 - 인증 오류:', authError)
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    console.log('테스트 삭제 - 인증된 사용자:', { userId: user.id, email: user.email })

    // 직접 삭제 시도
    const { error: deleteError } = await supabase
      .from('regular_event_vote_options')
      .delete()
      .eq('id', optionId)
      .eq('regular_event_id', eventId)

    if (deleteError) {
      console.error('테스트 삭제 실패:', deleteError)
      return NextResponse.json({ error: '삭제 실패: ' + deleteError.message }, { status: 500 })
    }

    console.log('테스트 삭제 성공:', { optionId })

    return NextResponse.json({
      success: true,
      message: '테스트 삭제가 성공했습니다.',
      optionId,
      eventId
    })

  } catch (error) {
    console.error('테스트 삭제 오류:', error)
    return NextResponse.json({ error: '서버 오류: ' + (error instanceof Error ? error.message : '알 수 없는 오류') }, { status: 500 })
  }
}
