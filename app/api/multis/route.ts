// 📁 /app/api/multis/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.warn('🚫 [WARN] 로그인된 유저 없음')
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json()
  const { error } = await supabase.from('multis').insert({
    ...body,
    author_id: user.id,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('❌ [ERROR] 등록 실패:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}