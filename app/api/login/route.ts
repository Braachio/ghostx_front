// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { email, password } = await req.json()

  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !user) {
    return NextResponse.json({ error: error?.message || '로그인 실패' }, { status: 401 })
  }

  return NextResponse.json({ success: true, user })
}
