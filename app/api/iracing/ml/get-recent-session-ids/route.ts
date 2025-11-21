import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { irGet } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const limiter = new IpRateLimiter(30) // 데이터 수집을 위해 rate limit 완화

/**
 * GET /api/iracing/ml/get-recent-session-ids
 * 최근 세션 ID 목록 가져오기
 * 
 * Query params:
 * - cust_id: 드라이버 ID (필수)
 * - limit: 최대 개수 (기본값 50)
 */
export async function GET(req: NextRequest) {
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
    const custId = searchParams.get('cust_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!custId) {
      return NextResponse.json({ error: 'cust_id required' }, { status: 400 })
    }

    const custIdNum = parseInt(custId, 10)
    if (isNaN(custIdNum)) {
      return NextResponse.json({ error: 'Invalid cust_id' }, { status: 400 })
    }

    // 최근 레이스 데이터 가져오기
    const rawResponse = await irGet<any>(
      '/data/stats/member_recent_races',
      { cust_id: custIdNum }
    )

    console.log(`[Get Recent Session IDs] Raw API response for cust_id ${custIdNum}:`, {
      type: typeof rawResponse,
      isArray: Array.isArray(rawResponse),
      keys: rawResponse && typeof rawResponse === 'object' ? Object.keys(rawResponse) : null,
      sample: rawResponse,
    })

    // API 응답이 다양한 형식일 수 있음: 배열, {races: []}, {results: []} 등
    let recentRacesData: any[] = []
    
    if (Array.isArray(rawResponse)) {
      recentRacesData = rawResponse
    } else if (rawResponse && typeof rawResponse === 'object') {
      // 객체로 감싸진 경우
      recentRacesData = rawResponse.races || 
                       rawResponse.results || 
                       rawResponse.data || 
                       []
    }

    console.log(`[Get Recent Session IDs] Processed races data:`, {
      length: recentRacesData.length,
      firstItem: recentRacesData.length > 0 ? recentRacesData[0] : null,
    })

    if (!recentRacesData || !Array.isArray(recentRacesData) || recentRacesData.length === 0) {
      console.warn(`[Get Recent Session IDs] No races found in response:`, rawResponse)
      return NextResponse.json({ 
        sessionIds: [], 
        count: 0,
        custId: custIdNum,
        debug: {
          rawResponseType: typeof rawResponse,
          rawResponseKeys: rawResponse && typeof rawResponse === 'object' ? Object.keys(rawResponse) : null,
        }
      })
    }

    if (recentRacesData.length === 0) {
      console.log(`[Get Recent Session IDs] No recent races found for cust_id ${custIdNum}`)
      return NextResponse.json({ sessionIds: [], count: 0, custId: custIdNum })
    }

    // subsession_id 추출 (다양한 필드명 시도)
    const sessionIds = Array.from(
      new Set(
        recentRacesData
          .slice(0, limit)
          .map((race: any) => {
            // 다양한 필드명 시도
            const id = race.subsession_id ?? 
                      race.subsessionId ?? 
                      race.subsessionid ?? 
                      race.session_id ?? 
                      race.sessionId ?? 
                      race.sessionid ??
                      null
            
            if (id === null) {
              console.warn(`[Get Recent Session IDs] No subsession_id found in race:`, {
                keys: Object.keys(race),
                race: race,
              })
            }
            
            return id
          })
          .filter((id: any): id is number => {
            if (id === null) return false
            // 문자열인 경우 숫자로 변환 시도
            if (typeof id === 'string') {
              const num = parseInt(id, 10)
              return !isNaN(num)
            }
            return typeof id === 'number'
          })
          .map((id: any) => typeof id === 'string' ? parseInt(id, 10) : id)
      )
    )

    console.log(`[Get Recent Session IDs] Extracted ${sessionIds.length} unique session IDs from ${recentRacesData.length} races`)

    return NextResponse.json({
      sessionIds,
      count: sessionIds.length,
      custId: custIdNum,
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Get Recent Session IDs] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

