import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // ✅ 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.warn('🚫 [WARN] 로그인된 유저 없음')
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // ✅ 유저의 role 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    console.warn('🚫 [WARN] 관리자 권한 아님')
    return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 })
  }

  // ✅ 본문 파싱 및 등록
  const body = await req.json()
  const { error: insertError } = await supabase.from('multis').insert({
    ...body,
    author_id: user.id,
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error('❌ [ERROR] 공지 등록 실패:', insertError.message)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  console.log('✅ [SUCCESS] 공지 등록 성공')
  return NextResponse.json({ success: true })
}
