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

// GET: 채팅 메시지 조회
export async function GET() {
  try {
    // const { eventId } = await params

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

    // 빈 배열 반환 (더미 데이터 제거)
    return NextResponse.json([])

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

    // 임시로 성공 응답 반환
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      event_id: eventId,
      nickname,
      message,
      color,
      created_at: new Date().toISOString()
    }

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
