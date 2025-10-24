import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from 'lib/database.types'

// GET - 갤러리 인증 코드 생성
export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 인증 코드 생성 (사용자 ID의 마지막 8자리 사용)
    const verificationCode = `빵장신청_${user.id.slice(-8)}`
    
    return NextResponse.json({ 
      verification_code: verificationCode,
      instructions: [
        '1. 심레이싱게임갤러리에서 새 게시글을 작성하세요',
        '2. 게시글 제목에 "빵장신청" 키워드를 포함하세요',
        '3. 게시글 내용에 아래 인증 코드를 포함하세요:',
        `4. 인증 코드: ${verificationCode}`,
        '5. 게시글 작성 후 이 페이지로 돌아와서 인증 코드를 입력하세요'
      ]
    })

  } catch (error) {
    console.error('갤러리 인증 코드 생성 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
