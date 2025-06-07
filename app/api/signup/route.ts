import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  const { email, password, nickname } = await req.json()

  // 회원가입
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

  // profiles 테이블에 명시적으로 삽입
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: user.id, email, nickname }])

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message || '프로필 저장 실패' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
