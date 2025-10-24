import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from 'lib/database.types'
import { GallogApi } from 'lib/gallog-api'

// POST - 갤로그 방명록에 인증 코드 전송
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const { gallery_nickname, gallog_id } = body

    if (!gallery_nickname) {
      return NextResponse.json({ error: '갤러리 닉네임은 필수입니다.' }, { status: 400 })
    }

    if (!gallog_id) {
      return NextResponse.json({ error: '갤로그 식별 코드는 필수입니다.' }, { status: 400 })
    }

    // 실제 활동하고 있는 빵장 화이트리스트
    const authorizedGalleryNicknames = [
      '조상님',
      '급발진',
      '붕프레자', 
      '노란부리오리',
      'Estre',
      '세이프티카를타고니이모를찾아서',
      '보만다지진',
      '121_175',
      'Lycoriss',
      '민법학원론'
    ]

    // 갤러리 닉네임이 화이트리스트에 있는지 확인
    if (!authorizedGalleryNicknames.includes(gallery_nickname)) {
      return NextResponse.json({ 
        error: '정기 갤멀 운영 빵장만 신청할 수 있습니다. 관리자에게 문의하세요.' 
      }, { status: 403 })
    }

    // 인증 코드 생성 (알파벳과 숫자만 사용)
    const generateRandomCode = (length: number) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }
    
    const verificationCode = `BAK${generateRandomCode(8)}`
    
    // 실제 갤로그 API 연동
    try {
      console.log(`갤로그 방명록 전송 시도: ${gallery_nickname}에게 ${verificationCode} 전송`)
      
      // 수동 방식으로 변경 - 자동 전송 대신 사용자 안내
      console.log('갤로그 수동 인증 방식으로 변경')
        
        // 인증 코드를 DB에 저장
        const { error: insertError } = await supabase
          .from('gallery_verification_codes')
          .insert({
            user_id: user.id,
            gallery_nickname,
            verification_code: verificationCode,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10분 후 만료
          })

        if (insertError) {
          console.error('인증 코드 저장 오류:', insertError)
          // 테이블이 존재하지 않는 경우 안내 메시지
          if (insertError.message.includes('does not exist')) {
            return NextResponse.json({ 
              error: '갤로그 인증 테이블이 존재하지 않습니다. 관리자에게 문의하세요.' 
            }, { status: 500 })
          }
        }

        return NextResponse.json({ 
          success: true,
          message: `인증 코드가 생성되었습니다. 아래 안내에 따라 갤로그에 직접 작성해주세요.`,
          verification_code: verificationCode,
          instructions: [
            `1. https://gallog.dcinside.com/${gallog_id}/guestbook 에 접속하세요`,
            `2. 방명록에 다음 메시지를 작성하세요:`,
            `   ${verificationCode}`,
            '3. 비밀글로 설정하세요',
            '4. 작성 완료 후 아래 입력란에 인증 코드를 입력하세요'
          ]
        })
    } catch (error) {
      console.error('갤로그 인증 코드 생성 오류:', error)
      return NextResponse.json({ 
        error: `인증 코드 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('갤로그 인증 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// GET - 인증 코드 검증
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const verificationCode = searchParams.get('code')

    if (!verificationCode) {
      return NextResponse.json({ error: '인증 코드가 필요합니다.' }, { status: 400 })
    }

    // URL 디코딩 처리
    const decodedCode = decodeURIComponent(verificationCode)
    console.log('인증 코드 검증 시도:', { 
      original: verificationCode, 
      decoded: decodedCode,
      user_id: user.id 
    })

    // 인증 코드 검증 (디코딩된 코드 사용)
    const { data: verification, error } = await supabase
      .from('gallery_verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_code', decodedCode)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !verification) {
      console.log('인증 코드 검증 실패:', { 
        error: error?.message, 
        verification: verification,
        decodedCode,
        user_id: user.id 
      })
      return NextResponse.json({ 
        error: '인증 코드가 올바르지 않거나 만료되었습니다.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      verified: true,
      gallery_nickname: verification.gallery_nickname
    })

  } catch (error) {
    console.error('인증 코드 검증 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
