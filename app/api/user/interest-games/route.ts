import { createClient } from '@/lib/supabaseServerClient'
import { NextRequest, NextResponse } from 'next/server'

// GET - 사용자의 관심 게임 목록 조회
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_interest_games')
      .select('game_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const gameNames = data.map(item => item.game_name)
    return NextResponse.json({ games: gameNames })
  } catch (error) {
    console.error('관심 게임 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST - 관심 게임 추가
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/user/interest-games 시작')
    
    const { gameName } = await request.json()
    console.log('📝 요청 데이터:', { gameName })

    if (!gameName) {
      console.log('❌ 게임명 누락')
      return NextResponse.json({ error: '게임명이 필요합니다' }, { status: 400 })
    }

    console.log('🔐 Supabase 클라이언트 생성 중...')
    const supabase = createClient()
    console.log('✅ Supabase 클라이언트 생성 완료')

    console.log('👤 사용자 인증 확인 중...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔍 인증 결과:', { user: user?.id, authError })

    if (authError || !user) {
      console.log('❌ 인증 실패:', authError?.message)
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    console.log('💾 데이터베이스 삽입 시도:', { user_id: user.id, game_name: gameName })
    const { error } = await supabase
      .from('user_interest_games')
      .insert({
        user_id: user.id,
        game_name: gameName
      })

    if (error) {
      console.log('❌ 데이터베이스 오류:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: '이미 관심 게임으로 등록되어 있습니다' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ 관심 게임 추가 성공')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('💥 관심 게임 추가 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE - 관심 게임 제거
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameName = searchParams.get('gameName')

    if (!gameName) {
      return NextResponse.json({ error: '게임명이 필요합니다' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { error } = await supabase
      .from('user_interest_games')
      .delete()
      .eq('user_id', user.id)
      .eq('game_name', gameName)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('관심 게임 제거 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
