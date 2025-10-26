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
    const { id, optionId } = await params

    console.log('투표 옵션 삭제:', { regularEventId: id, optionId })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 이벤트 관리 권한 확인
    const hasPermission = await hasEventManagementPermission(user.id, id)
    
    if (!hasPermission) {
      return NextResponse.json({ error: '이벤트 관리 권한이 없습니다.' }, { status: 403 })
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
