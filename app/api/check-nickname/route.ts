// /app/api/check-nickname/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
  const { nickname } = await req.json()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle()

  if (error) {
    console.error('닉네임 확인 오류:', error.message)
    return NextResponse.json({ available: null }, { status: 500 })
  }

  return NextResponse.json({ available: !data })
}
