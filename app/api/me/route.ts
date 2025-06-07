import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const cookieStore = cookies() // ❗ `cookies()`는 여전히 동기처럼 사용해도 됩니다 (Next.js v14 기준)
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  const userResponse = await supabase.auth.getUser()

  const user = userResponse.data.user

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nickname')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: '프로필 조회 실패' }, { status: 500 })
  }

  return NextResponse.json({ user: profile })
}
