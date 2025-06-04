import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

/**
 * GET /api/multis - 전체 공지 목록 조회
 */
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

/**
 * POST /api/multis - 로그인한 유저만 공지 등록 가능
 */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.warn('🚫 [WARN] 로그인된 유저 없음')
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 유저 권한 확인 (예: "admin" 역할만 등록 가능)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json()
  console.log('📥 [DEBUG] POST body:', body)

  const { error } = await supabase.from('multis').insert({
    ...body,
    author_id: user.id,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('❌ [ERROR] Insert 실패:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [SUCCESS] 공지 등록 성공')
  return NextResponse.json({ success: true })
}
