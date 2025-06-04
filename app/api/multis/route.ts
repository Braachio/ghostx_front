import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import jwt from 'jsonwebtoken'

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key'

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

  // ✅ 동기 방식으로 쿠키 추출
  const cookie = (await cookies()).get('token')
  const cookieToken = cookie?.value ?? null

  const headerRaw = req.headers.get('authorization')
  const headerToken =
    headerRaw && headerRaw.startsWith('Bearer ')
      ? headerRaw.slice(7).trim() || null
      : null

  console.log('🧪 [DEBUG] raw cookie:', cookie)
  console.log('🧪 [DEBUG] 쿠키 토큰 값:', cookieToken)
  console.log('🧪 [DEBUG] Authorization 헤더:', headerRaw)
  console.log('🧪 [DEBUG] headerToken:', headerToken)

  const access_token = headerToken || cookieToken
  console.log('🪵 [DEBUG] 최종 access_token:', access_token)

  const { isAdmin, userId } = await checkAdmin(access_token)

  if (!isAdmin || !userId) {
    console.warn('🚫 [WARN] 권한 없음 - 관리자 아님 또는 userId 없음')
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

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
