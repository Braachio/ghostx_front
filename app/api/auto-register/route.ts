import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies as getCookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseCsvDateToWeek } from '@/lib/dateParser'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies: getCookies })

  const body = await req.json()

  try {
    const {
      일자, 요일, 시간, 게임, 서킷,
      클래스, 레이스, 공지
    } = body

    const { year, week } = parseCsvDateToWeek(일자)
    const link = 공지?.startsWith('http') ? 공지 : ''

    // 🔍 중복 여부 확인
    const { data: existing, error: selectError } = await supabase
      .from('multis')
      .select('id')
      .eq('game', 게임)
      .eq('game_track', 서킷)
      .eq('multi_race', 레이스)
      .eq('multi_time', 시간?.split('~')?.[0]?.trim() || '')
      .eq('link', link)
      .eq('year', year)
      .eq('week', week)
      .limit(1)

    if (selectError) {
      console.error('중복 확인 실패:', selectError)
      return NextResponse.json({ error: '중복 확인 실패' }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: '중복 건너뜀' })
    }

    const { error } = await supabase.from('multis').insert({
      title: `${레이스}`,
      game: 게임,
      game_track: 서킷,
      multi_class: 클래스,
      multi_race: 레이스,
      multi_day: [요일],
      multi_time: 시간?.split('~')?.[0]?.trim() || '',
      link,
      year,
      week,
      anonymous_nickname: 'csv업로드',
      anonymous_password: '9999',
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('등록 실패:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '등록 성공' })
  } catch (err) {
    console.error('예외 발생:', err)
    return NextResponse.json({ error: '예외 발생' }, { status: 500 })
  }
}
