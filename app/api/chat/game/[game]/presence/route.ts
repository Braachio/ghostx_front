import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// 메모리 기반 접속자 추적 (실제 프로덕션에서는 Redis 등을 사용하는 것이 좋음)
interface Presence {
  userId: string
  steamId: string | null
  nickname: string
  color: string
  lastSeen: number
  game: string
}

// 게임별 접속자 맵: Map<game, Map<userId, Presence>>
const presenceStore = new Map<string, Map<string, Presence>>()

// 1분 이상 하트비트가 없으면 자동으로 제거
const PRESENCE_TIMEOUT = 60000 // 1분

// 주기적으로 만료된 접속자 제거
setInterval(() => {
  const now = Date.now()
  presenceStore.forEach((users, game) => {
    users.forEach((presence, userId) => {
      if (now - presence.lastSeen > PRESENCE_TIMEOUT) {
        users.delete(userId)
      }
    })
    if (users.size === 0) {
      presenceStore.delete(game)
    }
  })
}, 30000) // 30초마다 정리

// GET: 현재 접속자 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params
    const users = presenceStore.get(game) || new Map<string, Presence>()
    
    const now = Date.now()
    const activeUsers = Array.from(users.values())
      .filter(p => now - p.lastSeen <= PRESENCE_TIMEOUT)
      .map(p => ({
        userId: p.userId,
        steamId: p.steamId,
        nickname: p.nickname,
        color: p.color,
        lastSeen: new Date(p.lastSeen)
      }))
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())

    return NextResponse.json(activeUsers)
  } catch (error) {
    console.error('접속자 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '접속자 목록을 불러올 수 없습니다.' },
      { status: 500 }
    )
  }
}

// POST: 접속/해제 신호
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params
    
    // sendBeacon 사용 시 Blob으로 전송될 수 있으므로 처리
    let body: { action: 'join' | 'leave' | 'heartbeat'; nickname?: string; color?: string }
    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
      } else {
        throw new Error('Empty body')
      }
    } catch {
      // JSON 파싱 실패 시 빈 body로 처리 (이미 해제됨으로 간주)
      const cookieStore = await cookies()
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
      const { data: { user } } = await supabase.auth.getUser()
      if (user && game) {
        const users = presenceStore.get(game)
        if (users) {
          users.delete(user.id)
        }
      }
      return NextResponse.json({ success: true, message: '접속 해제됨' })
    }
    
    const { action, nickname, color } = body // action: 'join' | 'leave' | 'heartbeat'

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    // Steam 로그인 확인
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

    // 프로필에서 Steam ID 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('steam_id')
      .eq('id', user.id)
      .single()

    if (!game) {
      return NextResponse.json(
        { error: '게임이 지정되지 않았습니다.' },
        { status: 400 }
      )
    }

    if (!presenceStore.has(game)) {
      presenceStore.set(game, new Map<string, Presence>())
    }

    const users = presenceStore.get(game)!

    if (action === 'leave') {
      // 접속 해제
      users.delete(user.id)
      return NextResponse.json({ success: true, message: '접속 해제됨' })
    }

    // join 또는 heartbeat
    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      )
    }

    const now = Date.now()
    const presence: Presence = {
      userId: user.id,
      steamId: profile?.steam_id || null,
      nickname: nickname,
      color: color || '#3B82F6',
      lastSeen: now,
      game: game
    }

    // Steam ID가 같으면 기존 접속자 제거 (중복 방지)
    if (presence.steamId) {
      users.forEach((existingPresence, existingUserId) => {
        if (existingPresence.steamId === presence.steamId && existingUserId !== user.id) {
          users.delete(existingUserId)
        }
      })
    }

    // 기존 접속자가 있으면 업데이트, 없으면 추가
    users.set(user.id, presence)

    return NextResponse.json({ success: true, message: '접속 상태 업데이트됨' })
  } catch (error) {
    console.error('접속 상태 업데이트 실패:', error)
    return NextResponse.json(
      { error: '접속 상태를 업데이트할 수 없습니다.' },
      { status: 500 }
    )
  }
}

