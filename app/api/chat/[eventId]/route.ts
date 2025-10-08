import { NextRequest, NextResponse } from 'next/server'
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
// import { cookies } from 'next/headers'
// import type { Database } from '@/lib/database.types'

// 채팅 메시지 타입
interface ChatMessage {
  id: string
  event_id: string
  nickname: string
  message: string
  color: string
  created_at: string
}

// 임시 메모리 저장소 (서버 재시작 시 초기화됨)
const chatMessages: ChatMessage[] = []

// GET: 채팅 메시지 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    // TODO: 실제 데이터베이스 테이블이 생성되면 활성화
    // const cookieStore = await cookies()
    // const supabase = createRouteHandlerClient<Database>({
    //   cookies: () => cookieStore,
    // })
    // const { data, error } = await supabase
    //   .from('event_chat_messages')
    //   .select('*')
    //   .eq('event_id', eventId)
    //   .order('created_at', { ascending: true })

    // 임시 메모리에서 해당 이벤트의 메시지들 반환
    const eventMessages = chatMessages
      .filter(msg => msg.event_id === eventId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return NextResponse.json(eventMessages)

    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 })
    // }

    // return NextResponse.json(data)
  } catch (error) {
    console.error('채팅 메시지 조회 실패:', error)
    return NextResponse.json(
      { error: '채팅 메시지를 불러올 수 없습니다.' },
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

    // TODO: 실제 데이터베이스 테이블이 생성되면 활성화
    // const cookieStore = await cookies()
    // const supabase = createRouteHandlerClient<Database>({
    //   cookies: () => cookieStore,
    // })
    // const { data, error } = await supabase
    //   .from('event_chat_messages')
    //   .insert({
    //     event_id: eventId,
    //     nickname,
    //     message,
    //     color,
    //     created_at: new Date().toISOString()
    //   })
    //   .select()
    //   .single()

    // 임시 메모리에 메시지 저장
    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      event_id: eventId,
      nickname,
      message,
      color,
      created_at: new Date().toISOString()
    }

    chatMessages.push(newMessage)
    
    // 메모리 정리: 100개 이상 메시지가 쌓이면 오래된 것부터 삭제
    if (chatMessages.length > 100) {
      chatMessages.splice(0, chatMessages.length - 100)
    }

    console.log(`채팅 메시지 저장됨: ${eventId} - ${nickname}: ${message}`)

    return NextResponse.json(newMessage)

    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 })
    // }

    // return NextResponse.json(data)
  } catch (error) {
    console.error('채팅 메시지 전송 실패:', error)
    return NextResponse.json(
      { error: '메시지를 전송할 수 없습니다.' },
      { status: 500 }
    )
  }
}
