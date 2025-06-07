import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
  const { email } = await req.json()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('이메일 확인 오류:', error.message)
    return NextResponse.json({ available: null }, { status: 500 })
  }

  return NextResponse.json({ available: !data }) // data가 없으면 사용 가능
}
