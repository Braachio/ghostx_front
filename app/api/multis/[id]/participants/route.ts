import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET /api/multis/[id]/participants - 참가자 목록 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    console.log(`참가자 목록 조회 요청 - Event ID: ${id}`)

    // 실제 데이터베이스에서 참가자 목록 조회
    const { data, error } = await supabase
      .from('participants')
      .select(`
        id,
        user_id,
        nickname,
        status,
        joined_at
      `)
      .eq('event_id', id)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error(`참가자 목록 조회 실패 - Event ID: ${id}, Error:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const participants = data || []
    console.log(`참가자 목록 반환 - ${participants.length}명`)

    return NextResponse.json({ 
      participants,
      total: participants.length,
      confirmed: participants.filter(p => p.status === 'confirmed').length,
      pending: participants.filter(p => p.status === 'pending').length
    })
  } catch (e: any) {
    console.error('참가자 목록 조회 오류:', e?.message)
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}

// POST /api/multis/[id]/participants - 참가 신청
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    console.log(`참가 신청 요청 - Event ID: ${id}, Body:`, body)

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('참가 신청 실패 - 인증 오류')
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 이미 참가했는지 확인
    const { data: existingParticipant } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json({ error: '이미 참가 신청하셨습니다.' }, { status: 400 })
    }

    // 참가자 추가
    const { data: newParticipant, error: insertError } = await supabase
      .from('participants')
      .insert({
        event_id: id,
        user_id: user.id,
        nickname: body.nickname || '익명',
        status: 'confirmed'
      })
      .select()
      .single()

    if (insertError) {
      console.error(`참가 신청 실패 - Event ID: ${id}, User ID: ${user.id}, Error:`, insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`참가 신청 성공 - User ID: ${user.id}, Nickname: ${body.nickname}`)

    return NextResponse.json({ 
      success: true,
      participant: newParticipant,
      message: '참가 신청이 완료되었습니다.'
    })
  } catch (e: any) {
    console.error('참가 신청 오류:', e?.message)
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}

// DELETE /api/multis/[id]/participants - 참가 취소
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    console.log(`참가 취소 요청 - Event ID: ${id}`)

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('참가 취소 실패 - 인증 오류')
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 참가자 삭제
    const { error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('event_id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error(`참가 취소 실패 - Event ID: ${id}, User ID: ${user.id}, Error:`, deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`참가 취소 성공 - User ID: ${user.id}`)

    return NextResponse.json({ 
      success: true,
      message: '참가가 취소되었습니다.'
    })
  } catch (e: any) {
    console.error('참가 취소 오류:', e?.message)
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}
