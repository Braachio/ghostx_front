// ✅ app/api/update-nickname/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })

  const { nickname } = await req.json()
  if (!nickname) return NextResponse.json({ error: '닉네임이 없습니다.' }, { status: 400 })

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    nickname,
    email: user.email,
    agreed_terms: true,
    agreed_privacy: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
