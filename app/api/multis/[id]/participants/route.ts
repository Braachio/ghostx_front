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

    // 1) 참가자 목록 조회 (조인 없이 먼저 가져오기)
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, user_id, nickname, status, joined_at')
      .eq('event_id', id)
      .order('joined_at', { ascending: false })

    if (participantsError) {
      console.error(`참가자 목록 조회 실패 - Event ID: ${id}, Error:`, participantsError.message)
      return NextResponse.json({ error: participantsError.message }, { status: 500 })
    }

    const safeParticipants = participants || []
    console.log(`참가자 기본 목록 반환 - ${safeParticipants.length}명`)

    // 2) 프로필에서 steam_id를 별도 조회하여 매핑 (조인 문제/제약 회피)
    const userIds = safeParticipants.map(p => p.user_id).filter(Boolean)
    let steamIdByUserId: Record<string, string | null> = {}

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, steam_id')
        .in('id', userIds)

      if (profilesError) {
        console.warn('프로필 조회 실패(무시하고 계속 진행):', profilesError.message)
      } else if (profiles) {
        const typedProfiles = profiles as Array<{ id: string; steam_id: string | null }>
        steamIdByUserId = typedProfiles.reduce((acc: Record<string, string | null>, cur) => {
          acc[cur.id] = cur.steam_id ?? null
          return acc
        }, {})
      }
    }

    const participantsWithSteamId = safeParticipants.map(p => ({
      ...p,
      steam_id: steamIdByUserId[p.user_id] ?? null,
    }))

    return NextResponse.json({
      participants: participantsWithSteamId,
      total: participantsWithSteamId.length,
      confirmed: participantsWithSteamId.filter(p => p.status === 'confirmed').length,
      pending: participantsWithSteamId.filter(p => p.status === 'pending').length,
    })
  } catch (e: unknown) {
    const error = e as Error
    console.error('참가자 목록 조회 오류:', error?.message)
    return NextResponse.json({ error: error?.message || '서버 오류' }, { status: 500 })
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

    console.log('인증된 사용자:', { userId: user.id, email: user.email })

    // 이미 참가했는지 확인 (더 안전한 방법)
    const { data: existingParticipants, error: checkError } = await supabase
      .from('participants')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)

    console.log('기존 참가자 확인:', { existingParticipants, checkError })

    if (checkError) {
      console.error('참가자 확인 중 오류:', checkError)
      return NextResponse.json({ error: '참가자 상태 확인 중 오류가 발생했습니다.' }, { status: 500 })
    }

    if (existingParticipants && existingParticipants.length > 0) {
      console.log('이미 참가 신청된 사용자:', user.id)
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
  } catch (e: unknown) {
    const error = e as Error
    console.error('참가 신청 오류:', error?.message)
    return NextResponse.json({ error: error?.message || '서버 오류' }, { status: 500 })
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
    const { data: deletedData, error: deleteError } = await supabase
      .from('participants')
      .delete()
      .eq('event_id', id)
      .eq('user_id', user.id)
      .select()

    console.log('참가자 삭제 결과:', { deletedData, deleteError })

    if (deleteError) {
      console.error(`참가 취소 실패 - Event ID: ${id}, User ID: ${user.id}, Error:`, deleteError.message)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    if (!deletedData || deletedData.length === 0) {
      console.log('삭제할 참가자 데이터가 없음:', { eventId: id, userId: user.id })
      return NextResponse.json({ error: '참가 신청 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    console.log(`참가 취소 성공 - User ID: ${user.id}`)

    return NextResponse.json({ 
      success: true,
      message: '참가가 취소되었습니다.'
    })
  } catch (e: unknown) {
    const error = e as Error
    console.error('참가 취소 오류:', error?.message)
    return NextResponse.json({ error: error?.message || '서버 오류' }, { status: 500 })
  }
}
