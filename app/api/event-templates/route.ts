import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET: 이벤트 템플릿 목록 조회
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('event_templates')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('game', { ascending: true })

    if (error) {
      console.error('템플릿 조회 에러:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('템플릿 조회 예외:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST: 새 이벤트 템플릿 생성
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const { type, game, track, class: className, time, days, description } = body

    // 필수 필드 검증
    if (!type || !game || !track || !className || !time || !days || !Array.isArray(days)) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('event_templates')
      .insert({
        type,
        game,
        track,
        class: className,
        time,
        days,
        description: description || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('템플릿 생성 에러:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('템플릿 생성 예외:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
