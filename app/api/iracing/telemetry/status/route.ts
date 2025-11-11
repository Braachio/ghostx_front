import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'

/**
 * GET /api/iracing/telemetry/status
 * 로컬 SDK 서비스 연결 상태 확인
 * 
 * 이 엔드포인트는 로컬 서비스가 헬스체크용으로 호출할 수 있습니다.
 */
export async function GET(req: NextRequest) {
  if (!TELEMETRY_ENABLED) {
    return NextResponse.json({ error: TELEMETRY_DISABLED_MESSAGE, connected: false }, { status: 503 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 최근 세션 조회 (활성 세션 확인)
    const { data: recentSessions } = await supabase
      .from('iracing_telemetry_sessions')
      .select('id, start_time, end_time, is_complete, sample_count')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      connected: true,
      user_id: user.id,
      recent_session: recentSessions || null,
      message: 'SDK collector service can connect to this API',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'status check error'
    return NextResponse.json({ error: msg, connected: false }, { status: 500 })
  }
}

