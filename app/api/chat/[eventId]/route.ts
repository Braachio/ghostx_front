import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// 채팅 메시지 타입
interface ChatMessage {
  id: string
  event_id: string
  nickname: string
  message: string
  color: string
  created_at: string
}

// GET: 채팅 메시지 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // 데이터베이스에서 메시지 조회
    const { data: messages, error } = await supabase
      .from('event_chat_messages')
      .select('id, nickname, message, color, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('채팅 메시지 조회 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error('채팅 메시지 조회 실패:', error)
    return NextResponse.json(
      { error: '메시지를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST: 채팅 메시지 전송
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const body = await req.json()
    const { nickname, message, color } = body

    if (!nickname || !message) {
      return NextResponse.json(
        { error: '닉네임과 메시지는 필수입니다.' },
        { status: 400 }
      )
    }

    // 사용자 인증 확인
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 데이터베이스에 메시지 저장
    const { data, error } = await supabase
      .from('event_chat_messages')
      .insert({
        event_id: eventId,
        user_id: user.id,
        nickname,
        message,
        color: color || '#ffffff'
      })
      .select()
      .single()

    if (error) {
      console.error('채팅 메시지 저장 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`채팅 메시지 저장됨: ${eventId} - ${nickname}: ${message}`)

    return NextResponse.json(data)
  } catch (error) {
    console.error('채팅 메시지 전송 실패:', error)
    return NextResponse.json(
      { error: '메시지를 전송할 수 없습니다.' },
      { status: 500 }
    )
  }
}