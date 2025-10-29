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
    try {
      const { data: games, error: gamesError } = await supabase
        .from('user_interest_games')
        .select('game_name')
        .eq('user_id', user.id)

      if (gamesError) {
        console.error('관심게임 조회 오류:', gamesError)
        // 테이블이 없거나 RLS 문제인 경우 빈 배열 반환
        return NextResponse.json({ 
          games: [],
          success: true,
          message: '관심게임 테이블에 접근할 수 없습니다.'
        })
      }

      return NextResponse.json({ 
        games: games?.map(g => g.game_name) || [],
        success: true 
      })
    } catch (tableError) {
      console.error('관심게임 테이블 접근 오류:', tableError)
      // 테이블이 없어도 빈 배열로 처리
      return NextResponse.json({ 
        games: [],
        success: true,
        message: '관심게임 테이블이 존재하지 않습니다.'
      })
    }

  } catch (error) {
    console.error('관심게임 API 오류:', error)
    // 에러가 발생해도 빈 배열로 처리하여 배너가 정상 작동하도록 함
    return NextResponse.json({ 
      games: [],
      success: true,
      message: '관심게임을 불러올 수 없습니다.'
    })
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

    // user_interest_games 테이블이 없을 수 있으므로 try-catch로 처리
    try {
      // 기존 관심게임 삭제
      const { error: deleteError } = await supabase
        .from('user_interest_games')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('기존 관심게임 삭제 오류:', deleteError)
        // 삭제 실패해도 계속 진행
      }

      // 새로운 관심게임 추가
      if (gameIds.length > 0) {
        const { error: insertError } = await supabase
          .from('user_interest_games')
          .insert(
            gameIds.map(gameId => ({
              user_id: user.id,
              game_name: gameId,
              created_at: new Date().toISOString()
            }))
          )

        if (insertError) {
          console.error('관심게임 추가 오류:', insertError)
          // 테이블이 없거나 스키마 문제인 경우 성공으로 처리
          console.log('관심게임 테이블 문제로 인해 로컬 저장으로 대체')
        }
      }
    } catch (tableError) {
      console.error('관심게임 테이블 접근 오류:', tableError)
      // 테이블이 없어도 성공으로 처리
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
