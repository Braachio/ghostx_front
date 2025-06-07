import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const cookieStore = cookies() // ❌ await 제거
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  const { email, password } = await req.json()

  const {
    data: { session, user },
    error,
  } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !session || !user) {
    return NextResponse.json({ error: error?.message || '로그인 실패' }, { status: 401 })
  }

  return NextResponse.json({ success: true, user })
}
