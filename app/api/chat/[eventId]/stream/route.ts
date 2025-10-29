import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// Server-Sent Events를 위한 채팅 스트림
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

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

    // SSE 스트림 생성
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // 연결 확인 메시지 전송
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

        // Keepalive 메시지 전송 (30초마다)
        const keepaliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`:keepalive\n\n`))
          } catch (error) {
            clearInterval(keepaliveInterval)
          }
        }, 30000)

        // Supabase 실시간 구독 설정
        const channel = supabase
          .channel(`chat_${eventId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'event_chat_messages',
              filter: `event_id=eq.${eventId}`
            },
            (payload) => {
              try {
                const message = {
                  type: 'message',
                  data: payload.new
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
              } catch (error) {
                // 연결이 끊어진 경우 처리
                clearInterval(keepaliveInterval)
                supabase.removeChannel(channel)
              }
            }
          )
          .subscribe()

        // 클라이언트 연결 해제 시 정리
        const cleanup = () => {
          clearInterval(keepaliveInterval)
          supabase.removeChannel(channel)
          try {
            controller.close()
          } catch (error) {
            // 이미 닫힌 경우 무시
          }
        }

        req.signal.addEventListener('abort', cleanup)
        
        // 에러 발생 시 정리
        req.signal.addEventListener('error', cleanup)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('SSE 스트림 생성 실패:', error)
    return NextResponse.json(
      { error: '실시간 채팅 연결에 실패했습니다.' },
      { status: 500 }
    )
  }
}

