// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { email, password } = await req.json()

  // 1. 로그인
  const {
    data: { session, user },
    error,
  } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !session || !user) {
    return NextResponse.json({ error: error?.message || '로그인 실패' }, { status: 401 })
  }

  // 2. 쿠키에 세션 설정
  // auth-helpers가 자동으로 해줌 (중요: createRouteHandlerClient로 생성한 supabase 사용 시)

  return NextResponse.json({ success: true, user })
}
