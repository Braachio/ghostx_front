import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key' // 실제 배포 시엔 환경변수 필수

/**
 * JWT 기반 관리자 권한 확인
 */
async function checkAdmin(access_token: string | null): Promise<{ isAdmin: boolean; userId?: string }> {
  if (!access_token) {
    console.warn('🚫 [WARN] access_token 없음')
    return { isAdmin: false }
  }

  try {
    const decoded = jwt.verify(access_token, SECRET_KEY) as { sub: string; role: string }
    console.log('🪵 [DEBUG] decoded token:', decoded)
    return { isAdmin: decoded.role === 'admin', userId: decoded.sub }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('❌ [ERROR] JWT decoding 실패:', err.message)
    } else {
      console.error('❌ [ERROR] JWT decoding 실패: 알 수 없는 에러', err)
    }
    return { isAdmin: false }
  }
}

/**
 * GET /api/multis - 전체 목록 조회
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
 * POST /api/multis - 관리자만 공지 등록
 */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // 쿠키 정보 확인
  const cookieStore = cookies()
  const allCookies = await cookieStore
  const cookieToken = allCookies.get('token')?.value ?? null

  // 헤더 정보 확인
  const headerRaw = req.headers.get('authorization')
  const headerToken = headerRaw?.replace('Bearer ', '') ?? null

  // 로그 출력
  console.log('🧪 [DEBUG] 쿠키 전체:', allCookies)
  console.log('🧪 [DEBUG] 쿠키 access_token:', cookieToken)
  console.log('🧪 [DEBUG] Authorization 헤더:', headerRaw)

  // 최종 토큰 결정
  const access_token = headerToken || cookieToken
  console.log('🪵 [DEBUG] 최종 access_token:', access_token)

  // 권한 확인
  const { isAdmin, userId } = await checkAdmin(access_token)

  if (!isAdmin || !userId) {
    console.warn('🚫 [WARN] 권한 없음 - 관리자 아님 또는 userId 없음')
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  // 요청 본문 파싱 및 삽입
  const body = await req.json()
  console.log('🪵 [DEBUG] POST body:', body)

  const { error } = await supabase.from('multis').insert({
    ...body,
    author_id: userId,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('❌ [ERROR] Insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [SUCCESS] 공지 등록 성공')
  return NextResponse.json({ success: true })
}
