import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // URL에서 eventId 가져오기
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('디버그 - 사용자 정보:', { userId: user.id, email: user.email })

    // 모든 참가자 조회
    const { data: allParticipants, error: allError } = await supabase
      .from('participants')
      .select(`
        id,
        user_id,
        nickname,
        status,
        joined_at,
        event_id,
        profiles!inner(
          steam_id
        )
      `)
      .eq('event_id', eventId)
      .order('joined_at', { ascending: false })

    if (allError) {
      console.error('참가자 조회 오류:', allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // 현재 사용자의 참가 상태 확인
    const { data: userParticipant, error: userError } = await supabase
      .from('participants')
      .select(`
        id,
        user_id,
        nickname,
        status,
        joined_at,
        event_id
      `)
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    console.log('디버그 - 사용자 참가 상태:', { userParticipant, userError })

    return NextResponse.json({
      eventId,
      userId: user.id,
      userEmail: user.email,
      allParticipants: allParticipants || [],
      userParticipant: userParticipant || null,
      userError: userError?.message || null,
      totalParticipants: allParticipants?.length || 0,
      isParticipant: !!userParticipant,
      participantDetails: {
        total: allParticipants?.length || 0,
        confirmed: allParticipants?.filter(p => p.status === 'confirmed').length || 0,
        pending: allParticipants?.filter(p => p.status === 'pending').length || 0
      }
    })

  } catch (error) {
    console.error('디버그 API 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}