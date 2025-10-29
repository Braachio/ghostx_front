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

// GET: 게임별 채팅 메시지 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    const gameName = gameNames[game] || game
    const chatRoomId = `game_${gameName}` // 게임별 고유 채팅방 ID

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // game_name 필드로 게임별 채팅 필터링
    const { data: messages, error } = await supabase
      .from('event_chat_messages')
      .select('id, nickname, message, color, created_at')
      .eq('game_name', chatRoomId) // 게임별 채팅방 필터
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('게임별 채팅 메시지 조회 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sortedMessages = (messages || []).reverse()
    return NextResponse.json(sortedMessages)
  } catch (error) {
    console.error('게임별 채팅 메시지 조회 실패:', error)
    return NextResponse.json(
      { error: '메시지를 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST: 게임별 채팅 메시지 전송
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params
    const body = await req.json()
    const { nickname, message, color } = body

    if (!nickname || !message) {
      return NextResponse.json(
        { error: '닉네임과 메시지는 필수입니다.' },
        { status: 400 }
      )
    }

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

    // 게임별 채팅 메시지 저장 (event_id는 NULL, game_name 사용)
    const { data, error } = await supabase
      .from('event_chat_messages')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        event_id: null, // 게임별 채팅은 event_id 없음
        user_id: user.id,
        nickname,
        message,
        color: color || '#ffffff',
        game_name: chatRoomId // 게임별 채팅방 구분
      } as any) // 타입 체크 우회 (game_name 필드가 타입 정의에 없을 수 있음)
      .select()
      .single()

    if (error) {
      console.error('게임별 채팅 메시지 저장 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('게임별 채팅 메시지 전송 실패:', error)
    return NextResponse.json(
      { error: '메시지를 전송할 수 없습니다.' },
      { status: 500 }
    )
  }
}

