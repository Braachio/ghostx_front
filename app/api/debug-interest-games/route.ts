import { createClient } from '@/lib/supabaseServerClient'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔧 Debug: 관심 게임 API 테스트 시작')
    
    // Supabase 클라이언트 생성
    const supabase = createClient()
    console.log('✅ Supabase 클라이언트 생성 완료')

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔍 인증 결과:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    })

    if (authError || !user) {
      return NextResponse.json({ 
        error: '인증 실패', 
        authError: authError?.message,
        hasUser: !!user 
      }, { status: 401 })
    }

    // 테이블 존재 확인
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_interest_games')
      .select('count')
      .limit(1)

    console.log('📊 테이블 확인 결과:', { tableCheck, tableError })

    if (tableError) {
      return NextResponse.json({ 
        error: '테이블 접근 실패', 
        tableError: tableError.message,
        code: tableError.code 
      }, { status: 500 })
    }

    // 기존 관심 게임 조회
    const { data: existingGames, error: selectError } = await supabase
      .from('user_interest_games')
      .select('*')
      .eq('user_id', user.id)

    console.log('🎮 기존 관심 게임:', { existingGames, selectError })

    return NextResponse.json({
      success: true,
      userId: user.id,
      tableAccessible: true,
      existingGames: existingGames || [],
      selectError: selectError?.message
    })

  } catch (error) {
    console.error('💥 Debug API 오류:', error)
    return NextResponse.json({ 
      error: '서버 오류', 
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
