import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  try {
    const { email, password, agreed_terms, agreed_privacy } = await req.json()

    console.log({ email, password, agreed_terms, agreed_privacy }) // 확인용

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호는 필수입니다.' }, { status: 400 })
    }

    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
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
