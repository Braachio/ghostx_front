import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from 'lib/database.types'

// POST - 신청서 검토 (승인/거부)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'event_manager'].includes(profile.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, review_notes } = body

    // 상태 검증
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태입니다.' }, { status: 400 })
    }

    // 기존 신청서 확인
    const { data: existingApplication, error: fetchError } = await supabase
      .from('event_manager_applications')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingApplication) {
      return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 이미 검토된 신청서인지 확인
    if (existingApplication.status !== 'pending') {
      return NextResponse.json({ error: '이미 검토된 신청서입니다.' }, { status: 400 })
    }

    // 신청서 상태 업데이트
    const { data: updatedApplication, error: updateError } = await supabase
      .from('event_manager_applications')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('신청서 검토 오류:', updateError)
      return NextResponse.json({ error: '신청서 검토에 실패했습니다.' }, { status: 500 })
    }

    // 승인된 경우 사용자 역할 업데이트
    if (status === 'approved') {
      const { error: roleUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'event_manager' })
        .eq('id', existingApplication.user_id)

      if (roleUpdateError) {
        console.error('사용자 역할 업데이트 오류:', roleUpdateError)
        // 역할 업데이트 실패해도 신청서 상태는 이미 업데이트됨
        return NextResponse.json({ 
          success: true, 
          message: '신청서가 승인되었지만 역할 업데이트에 실패했습니다. 관리자가 수동으로 처리해주세요.',
          application: updatedApplication 
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'approved' ? '신청서가 승인되었습니다.' : '신청서가 거부되었습니다.',
      application: updatedApplication 
    })

  } catch (error) {
    console.error('신청서 검토 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
