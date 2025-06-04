// app/api/signup/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { email, password, username } = await req.json()

  // 유저 등록
  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.signUp({ email, password })

  if (signUpError || !user) {
    return NextResponse.json({ error: signUpError?.message || '회원가입 실패' }, { status: 400 })
  }

  // profiles 테이블에 연동된 정보 저장
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    username,
    role: 'user', // 기본 역할: 일반 유저
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, user })
}
