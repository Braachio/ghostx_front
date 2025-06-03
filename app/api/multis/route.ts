import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key' // 환경변수 사용 권장

/**
 * JWT 기반 관리자 권한 확인
 */
async function checkAdmin(access_token: string | null): Promise<{ isAdmin: boolean; userId?: string }> {
  if (!access_token) return { isAdmin: false }

  try {
    const decoded = jwt.verify(access_token, SECRET_KEY) as { sub: string; role: string }
    return { isAdmin: decoded.role === 'admin', userId: decoded.sub }
  } catch {
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

  const cookieStore = cookies()
  const cookieToken = (await cookieStore).get('access_token')?.value ?? null
  const headerToken = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  const access_token = headerToken || cookieToken

  const { isAdmin, userId } = await checkAdmin(access_token)

  if (!isAdmin || !userId) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json()

  const { error } = await supabase.from('multis').insert({
    ...body,
    author_id: userId,
    created_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
