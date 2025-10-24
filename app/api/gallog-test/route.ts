import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from 'lib/database.types'

// POST - 갤로그 API 테스트
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'event_manager'].includes(profile.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { test_nickname, test_gallog_id } = body

    if (!test_nickname) {
      return NextResponse.json({ error: '테스트할 갤로그 닉네임이 필요합니다.' }, { status: 400 })
    }

    if (!test_gallog_id) {
      return NextResponse.json({ error: '테스트할 갤로그 식별 코드가 필요합니다.' }, { status: 400 })
    }

    // 갤로그 API 테스트
    try {
      const { GallogApi } = await import('../../../lib/gallog-api')
      
      console.log('갤로그 API 테스트 시작:', test_nickname, test_gallog_id)
      
      // 갤로그 API 인스턴스 생성 (환경 변수 자동 로드)
      const gallogApi = new GallogApi()
      
      const testResult = await gallogApi.testConnection(test_gallog_id)
      
      console.log('갤로그 API 테스트 결과:', testResult)
      
      return NextResponse.json({
        success: testResult.success,
        message: testResult.success 
          ? `갤로그 API 테스트 성공: ${test_nickname}님의 갤로그(${test_gallog_id})에 테스트 메시지가 전송되었습니다.`
          : `갤로그 API 테스트 실패: ${testResult.error}`,
        details: testResult
      })

    } catch (error) {
      console.error('갤로그 API 테스트 오류:', error)
      return NextResponse.json({ 
        error: `갤로그 API 테스트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('갤로그 API 테스트 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
