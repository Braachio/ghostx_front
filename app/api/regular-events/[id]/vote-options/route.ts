import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { hasEventManagementPermission } from '@/lib/permissions'

// GET /api/regular-events/[id]/vote-options - 투표 옵션 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    console.log('투표 옵션 조회:', { regularEventId: id })

    // 투표 옵션 조회
    const { data: options, error } = await supabase
      .from('regular_event_vote_options')
      .select('id, option_type, option_value, votes_count, created_at')
      .eq('regular_event_id', id)
      .order('option_type', { ascending: true })
      .order('votes_count', { ascending: false })

    if (error) {
      console.error('투표 옵션 조회 실패:', error)
      return NextResponse.json({ error: '투표 옵션을 불러올 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      options: options || []
    })

  } catch (error) {
    console.error('투표 옵션 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST /api/regular-events/[id]/vote-options - 투표 옵션 추가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    console.log('투표 옵션 추가:', { regularEventId: id, body })

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

    const { option_type, option_value } = body

    if (!option_type || !option_value) {
      return NextResponse.json({ error: '옵션 타입과 값을 입력해주세요.' }, { status: 400 })
    }

    if (!['track', 'car_class'].includes(option_type)) {
      return NextResponse.json({ error: '유효하지 않은 옵션 타입입니다.' }, { status: 400 })
    }

    // 투표 옵션 추가
    const { data: newOption, error: insertError } = await supabase
      .from('regular_event_vote_options')
      .insert({
        regular_event_id: id,
        option_type: option_type,
        option_value: option_value
      })
      .select()
      .single()

    if (insertError) {
      console.error('투표 옵션 추가 실패:', insertError)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: '이미 존재하는 옵션입니다.' }, { status: 400 })
      }
      return NextResponse.json({ error: '투표 옵션 추가에 실패했습니다.' }, { status: 500 })
    }

    console.log('투표 옵션 추가 성공:', { optionId: newOption.id, optionValue: option_value })

    return NextResponse.json({
      success: true,
      option: newOption,
      message: '투표 옵션이 추가되었습니다.'
    })

  } catch (error) {
    console.error('투표 옵션 추가 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// PATCH /api/regular-events/[id]/vote-options - 투표 옵션 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    console.log('투표 옵션 수정:', { regularEventId: id, body })

    const { option_id, option_value } = body

    if (!option_id || !option_value) {
      return NextResponse.json({ error: '옵션 ID와 값을 입력해주세요.' }, { status: 400 })
    }

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

    // 투표 옵션 수정
    const { data: updatedOption, error: updateError } = await supabase
      .from('regular_event_vote_options')
      .update({
        option_value: option_value,
        updated_at: new Date().toISOString()
      })
      .eq('id', option_id)
      .eq('regular_event_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('투표 옵션 수정 실패:', updateError)
      return NextResponse.json({ error: '투표 옵션 수정에 실패했습니다.' }, { status: 500 })
    }

    console.log('투표 옵션 수정 성공:', { optionId: updatedOption.id, newValue: option_value })

    return NextResponse.json({
      success: true,
      option: updatedOption,
      message: '투표 옵션이 수정되었습니다.'
    })

  } catch (error) {
    console.error('투표 옵션 수정 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// DELETE /api/regular-events/[id]/vote-options - 투표 옵션 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    console.log('투표 옵션 삭제:', { regularEventId: id, body })

    const { option_id } = body

    if (!option_id) {
      return NextResponse.json({ error: '옵션 ID가 필요합니다.' }, { status: 400 })
    }

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
      .eq('id', option_id)
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
