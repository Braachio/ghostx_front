import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({
    cookies: cookies, // ✅ 함수 자체를 넘김 (이렇게만 바꿔도 깔끔함)
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

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
