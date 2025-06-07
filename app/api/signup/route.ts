// ✅ /app/api/signup/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  const { email, password } = await req.json()

  // 회원가입 처리
  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp({ email, password })

  if (signUpError || !user) {
    return NextResponse.json(
      { error: signUpError?.message || '회원가입 실패' },
      { status: 400 }
    )
  }

  // 프로필은 수동 등록하므로 따로 삽입 X

  return NextResponse.json({ success: true })
}
