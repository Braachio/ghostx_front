import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  try {
    const { email, password, agreed_terms, agreed_privacy } = await req.json()

    console.log({ email, password, agreed_terms, agreed_privacy }) // 확인용

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호는 필수입니다.' }, { status: 400 })
    }

    // localhost 환경 감지
    const url = new URL(req.url)
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    const baseUrl = isLocalhost 
      ? `${url.protocol}//${url.host}` 
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostx.site')

    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`,
        data: {
          agreed_terms: !!agreed_terms,
          agreed_privacy: !!agreed_privacy,
        },
      },
    })

    if (signUpError || !user) {
      return NextResponse.json(
        { error: signUpError?.message || '회원가입 실패' },
        { status: 400 }
      )
    }

    // 프로필 자동 생성 (이메일 인증 전에도 생성)
    try {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        nickname: email.split('@')[0],
        agreed_terms: !!agreed_terms,
        agreed_privacy: !!agreed_privacy,
      })
    } catch (profileError) {
      console.error('프로필 생성 에러:', profileError)
      // 프로필 생성 실패해도 회원가입은 성공으로 처리 (나중에 자동 생성됨)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('회원가입 에러:', error.message)
    } else {
      console.error('회원가입 에러:', error)
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
