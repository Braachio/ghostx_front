import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { hasEventManagementPermission } from '@/lib/permissions'

// DELETE /api/regular-events/[id]/vote-options/[optionId] - 투표 옵션 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // params를 await로 처리
    const resolvedParams = await params
    const { id, optionId } = resolvedParams

    console.log('투표 옵션 삭제 시작:', { 
      regularEventId: id, 
      optionId,
      resolvedParams,
      url: req.url 
    })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('삭제 실패 - 인증 오류:', authError)
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    console.log('인증된 사용자:', { userId: user.id, email: user.email })

    // 이벤트 관리 권한 확인
    const hasPermission = await hasEventManagementPermission(user.id, id)
    
    console.log('권한 확인 결과:', { hasPermission, userId: user.id, eventId: id })
    
    if (!hasPermission) {
      console.log('삭제 실패 - 권한 없음')
      return NextResponse.json({ error: '이벤트 관리 권한이 없습니다.' }, { status: 403 })
    }

    // 삭제 전 옵션 존재 확인
    const { data: existingOption, error: checkError } = await supabase
      .from('regular_event_vote_options')
      .select('id, option_value, regular_event_id')
      .eq('id', optionId)
      .eq('regular_event_id', id)
      .single()

    console.log('삭제 대상 옵션 확인:', { existingOption, checkError })

    if (checkError || !existingOption) {
      console.log('삭제 실패 - 옵션 없음')
      return NextResponse.json({ error: '삭제할 투표 옵션을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 투표 옵션 삭제
    const { error: deleteError } = await supabase
      .from('regular_event_vote_options')
      .delete()
      .eq('id', optionId)
      .eq('regular_event_id', id)

    if (deleteError) {
      console.error('투표 옵션 삭제 실패:', deleteError)
      return NextResponse.json({ error: '투표 옵션 삭제에 실패했습니다.' }, { status: 500 })
    }

    console.log('투표 옵션 삭제 성공:', { optionId })

    return NextResponse.json({
      success: true,
      message: '투표 옵션이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('투표 옵션 삭제 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
