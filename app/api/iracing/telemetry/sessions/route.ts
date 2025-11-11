import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'

const limiter = new IpRateLimiter(10)

/**
 * GET /api/iracing/telemetry/sessions
 * 사용자의 텔레메트리 세션 목록 조회
 * 
 * Query params:
 * - limit: 최대 개수 (기본값 20)
 * - offset: 오프셋 (기본값 0)
 */
export async function GET(req: NextRequest) {
  if (!TELEMETRY_ENABLED) {
    return NextResponse.json({ error: TELEMETRY_DISABLED_MESSAGE }, { status: 503 })
  }

  const ip = getClientIp(req)
  if (!limiter.allow(ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 세션 목록 조회
    const { data: sessions, error } = await supabase
      .from('iracing_telemetry_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch sessions:', error)
      throw error
    }

    // 각 세션의 샘플 개수도 조회
    const sessionsWithCount = await Promise.all(
      (sessions || []).map(async (session) => {
        const { count } = await supabase
          .from('iracing_telemetry_samples')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        return {
          ...session,
          actual_sample_count: count || 0,
        }
      })
    )

    return NextResponse.json({
      sessions: sessionsWithCount,
      total: sessionsWithCount.length,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch error'
    console.error('Telemetry sessions fetch error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

