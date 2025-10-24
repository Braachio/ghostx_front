import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from 'lib/database.types'

// GET - 특정 신청서 조회
export async function GET(
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

    const { id } = await params

    // 신청서 조회
    const { data: application, error } = await supabase
      .from('event_manager_applications')
      .select(`
        *,
        user:profiles!event_manager_applications_user_id_fkey(nickname, email),
        recommender:profiles!event_manager_applications_recommender_id_fkey(nickname),
        reviewer:profiles!event_manager_applications_reviewed_by_fkey(nickname)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('신청서 조회 오류:', error)
      return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인: 본인 신청서이거나 관리자여야 함
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = application.user_id === user.id
    const isAdmin = profile?.role && ['admin', 'event_manager'].includes(profile.role)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    return NextResponse.json({ application })

  } catch (error) {
    console.error('신청서 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PATCH - 신청서 수정 (본인만, pending 상태일 때만)
export async function PATCH(
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

    const { id } = await params
    const body = await req.json()

    // 기존 신청서 확인
    const { data: existingApplication, error: fetchError } = await supabase
      .from('event_manager_applications')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingApplication) {
      return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인: 본인 신청서여야 함
    if (existingApplication.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // pending 상태일 때만 수정 가능
    if (existingApplication.status !== 'pending') {
      return NextResponse.json({ error: '검토 중이거나 완료된 신청서는 수정할 수 없습니다.' }, { status: 400 })
    }

    // 신청서 수정
    const { data: updatedApplication, error: updateError } = await supabase
      .from('event_manager_applications')
      .update({
        application_reason: body.application_reason,
        management_experience: body.management_experience,
        community_contributions: body.community_contributions,
        recommender_id: body.recommender_id
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('신청서 수정 오류:', updateError)
      return NextResponse.json({ error: '신청서 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: '신청서가 수정되었습니다.',
      application: updatedApplication 
    })

  } catch (error) {
    console.error('신청서 수정 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE - 신청서 삭제 (본인만, pending 상태일 때만)
export async function DELETE(
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

    const { id } = await params

    // 기존 신청서 확인
    const { data: existingApplication, error: fetchError } = await supabase
      .from('event_manager_applications')
      .select('user_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingApplication) {
      return NextResponse.json({ error: '신청서를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 권한 확인: 본인 신청서여야 함
    if (existingApplication.user_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // pending 상태일 때만 삭제 가능
    if (existingApplication.status !== 'pending') {
      return NextResponse.json({ error: '검토 중이거나 완료된 신청서는 삭제할 수 없습니다.' }, { status: 400 })
    }

    // 신청서 삭제
    const { error: deleteError } = await supabase
      .from('event_manager_applications')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('신청서 삭제 오류:', deleteError)
      return NextResponse.json({ error: '신청서 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: '신청서가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('신청서 삭제 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
