import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 모두 입력하세요.' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookies(),
    })

    const { data: { session, user }, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !session || !user) {
      return NextResponse.json(
        { error: error?.message || '로그인 실패' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('로그인 에러:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
