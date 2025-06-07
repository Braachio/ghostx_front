// /api/check-nickname/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  })

  const { nickname } = await req.json()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: '중복 검사 실패' }, { status: 500 })
  }

  return NextResponse.json({ available: !data })
}
