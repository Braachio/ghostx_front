import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

// Server-Sent Events를 위한 게임별 채팅 스트림
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params

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

    const gameName = gameNames[game] || game
    const chatRoomId = `game_${gameName}`

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
          } catch {
            clearInterval(keepaliveInterval)
          }
        }, 30000)

        // Supabase 실시간 구독 설정 (game_name 필터 사용)
        const channel = supabase
          .channel(`game_chat_${chatRoomId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'event_chat_messages',
              filter: `game_name=eq.${chatRoomId}` // game_name으로 게임별 채팅 필터링
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any, // 타입 체크 우회 (game_name 필터가 타입 정의에 없을 수 있음)
            (payload) => {
              try {
                const message = {
                  type: 'message',
                  data: payload.new
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
              } catch {
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
          } catch {
            // 이미 닫힌 경우 무시
          }
        }

        req.signal.addEventListener('abort', cleanup)
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
    console.error('게임별 SSE 스트림 생성 실패:', error)
    return NextResponse.json(
      { error: '실시간 채팅 연결에 실패했습니다.' },
      { status: 500 }
    )
  }
}

