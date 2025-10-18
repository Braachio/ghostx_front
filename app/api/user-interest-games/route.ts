import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 사용자의 관심게임 조회
    const { data: games, error: gamesError } = await supabase
      .from('user_interest_games')
      .select('game_id')
      .eq('user_id', user.id)

    if (gamesError) {
      console.error('관심게임 조회 오류:', gamesError)
      return NextResponse.json({ error: '관심게임 조회에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ 
      games: games?.map(g => g.game_id) || [],
      success: true 
    })

  } catch (error) {
    console.error('관심게임 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { gameIds } = await req.json()

    if (!Array.isArray(gameIds)) {
      return NextResponse.json({ error: '게임 ID 배열이 필요합니다.' }, { status: 400 })
    }

    // 기존 관심게임 삭제
    const { error: deleteError } = await supabase
      .from('user_interest_games')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('기존 관심게임 삭제 오류:', deleteError)
      return NextResponse.json({ error: '관심게임 삭제에 실패했습니다.' }, { status: 500 })
    }

    // 새로운 관심게임 추가
    if (gameIds.length > 0) {
      const { error: insertError } = await supabase
        .from('user_interest_games')
        .insert(
          gameIds.map(gameId => ({
            user_id: user.id,
            game_id: gameId,
            created_at: new Date().toISOString()
          }))
        )

      if (insertError) {
        console.error('관심게임 추가 오류:', insertError)
        return NextResponse.json({ error: '관심게임 추가에 실패했습니다.' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '관심게임이 저장되었습니다.'
    })

  } catch (error) {
    console.error('관심게임 저장 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
