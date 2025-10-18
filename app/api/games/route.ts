import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET /api/games - 게임 목록 조회
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const { data: games, error } = await supabase
      .from('games')
      .select('id, name, display_name, icon, color')
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      console.error('게임 목록 조회 실패:', error)
      return NextResponse.json({ error: '게임 목록 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ games })
  } catch (error) {
    console.error('게임 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/games - 게임 생성 (관리자만)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'event_manager')) {
      return NextResponse.json({ error: '게임 생성 권한이 없습니다.' }, { status: 403 })
    }

    const { name, display_name, icon, color } = await req.json()

    if (!name || !display_name || !icon) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const { data: newGame, error: insertError } = await supabase
      .from('games')
      .insert({
        name,
        display_name,
        icon,
        color: color || 'bg-gray-600'
      })
      .select()
      .single()

    if (insertError) {
      console.error('게임 생성 실패:', insertError)
      return NextResponse.json({ error: '게임 생성 실패' }, { status: 500 })
    }

    return NextResponse.json({ game: newGame })
  } catch (error) {
    console.error('게임 생성 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
