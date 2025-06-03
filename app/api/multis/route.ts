// app/api/multis/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'

/**
 * 서버 사이드에서 Bearer 토큰을 받아 사용자의 role을 조회한 뒤,
 * admin 권한 여부를 반환합니다.
 * - access_token: "Bearer " 접두어를 제거한 순수 토큰 문자열
 */
async function checkAdmin(access_token: string | null): Promise<boolean> {
  if (!access_token) return false

  // supabaseAdmin은 서비스 롤 키를 사용하여 생성된 관리자용 Supabase 인스턴스입니다.
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token)
  if (error || !user) return false

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return false
  return profile.role === 'admin'
}

/**
 * GET /api/multis
 * 모든 멀티 공지 데이터를 생성일자 내림차순으로 가져옵니다.
 * (권한 검사 없이 모두 조회 가능)
 */
export async function GET() {
  // createRouteHandlerClient는 내부적으로 NEXT_PUBLIC_SUPABASE_URL 및
  // NEXT_PUBLIC_SUPABASE_ANON_KEY를 자동으로 참조합니다.
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
 * POST /api/multis
 * 신규 멀티 공지를 생성합니다.
 * - 요청 헤더에 "Authorization: Bearer <TOKEN>" 형태로 토큰이 담겨 있어야 함
 * - 해당 토큰 소유자가 admin 역할인 경우에만 삽입 허용
 */
export async function POST(req: Request) {
  // createRouteHandlerClient는 내부적으로 NEXT_PUBLIC_SUPABASE_URL 및
  // NEXT_PUBLIC_SUPABASE_ANON_KEY를 자동으로 참조합니다.
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // Authorization 헤더에서 Bearer 토큰만 추출
  const access_token = req.headers.get('authorization')?.replace('Bearer ', '') || null

  // admin 권한 검사
  if (!(await checkAdmin(access_token))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  // 요청 바디(JSON) 파싱
  const body = await req.json()

  // 멀티 공지 테이블에 삽입
  const { error } = await supabase.from('multis').insert({
    ...body,
    created_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
