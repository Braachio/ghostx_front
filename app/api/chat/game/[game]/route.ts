import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET: 게임별 채팅 메시지 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')
    const { game } = await params

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // 게임별 채팅 메시지 조회
    // 1) game_name 컬럼이 있는 경우: 해당 게임으로 필터링
    // 2) 컬럼이 없는 경우(구 스키마): event_id IS NULL 전체 반환 (임시 호환)
    let messages: any[] | null = null
    let error: any = null

    // 시도: game_name으로 필터
    const tryFilter = await supabase
      .from('event_chat_messages')
      .select('id, user_id, nickname, message, color, created_at, game_name')
      .eq('game_name', game)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (tryFilter.error) {
      // 컬럼이 없거나 오류 시, 구 방식으로 대체
      const fallback = await supabase
        .from('event_chat_messages')
        .select('id, user_id, nickname, message, color, created_at')
        .is('event_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      messages = fallback.data
      error = fallback.error
    } else {
      messages = tryFilter.data
      error = tryFilter.error
    }

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
    const body = await req.json()
    const { nickname, message, color } = body
    const { game } = await params

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
        { error: 'Steam 로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // Steam 사용자인지 확인
    const isSteamUser = 
      user.app_metadata?.provider === 'steam' || 
      user.user_metadata?.provider === 'steam' ||
      user.identities?.some(identity => identity.provider === 'steam') ||
      user.email?.includes('steam') ||
      user.user_metadata?.steam_id ||
      user.app_metadata?.steam_id

    if (!isSteamUser) {
      return NextResponse.json(
        { error: 'Steam 로그인이 필요합니다.' },
        { status: 403 }
      )
    }

    // 게임별 채팅 메시지 저장 (event_id는 NULL)
    // 신 스키마: game_name 저장 시도, 실패 시 구 스키마로 저장
    let data: any = null
    let error: any = null
    const tryInsert = await supabase
      .from('event_chat_messages')
      .insert({
        event_id: null,
        user_id: user.id,
        nickname,
        message,
        color: color || '#ffffff',
        game_name: game
      })
      .select('id, user_id, nickname, message, color, created_at, game_name')
      .single()

    if (tryInsert.error) {
      const fallback = await supabase
        .from('event_chat_messages')
        .insert({
          event_id: null,
          user_id: user.id,
          nickname,
          message,
          color: color || '#ffffff'
        })
        .select('id, user_id, nickname, message, color, created_at')
        .single()
      data = fallback.data
      error = fallback.error
    } else {
      data = tryInsert.data
      error = tryInsert.error
    }

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

