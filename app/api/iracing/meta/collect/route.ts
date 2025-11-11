import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import type { IracingSubsessionResult, IracingParticipant } from '@/lib/iracingTypes'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const limiter = new IpRateLimiter(10) // 수집 작업은 rate limit을 낮게 설정

/**
 * POST /api/iracing/meta/collect
 * iRacing 세션 결과를 수집하여 메타 데이터 생성
 * 
 * Query params:
 * - series_id: 시리즈 ID (필수)
 * - subsession_id: 특정 세션 ID (선택, 없으면 최근 세션들 수집)
 * - start_time: 수집 시작 시간 (선택)
 * - end_time: 수집 종료 시간 (선택)
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // 인증 확인 (관리자만 수집 가능하도록 설정 가능)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const seriesId = searchParams.get('series_id')
    const subsessionId = searchParams.get('subsession_id')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')

    if (!seriesId && !subsessionId) {
      return NextResponse.json({ error: 'series_id or subsession_id required' }, { status: 400 })
    }

    if (IRACING_MOCK) {
      // Mock 모드에서는 mock 데이터 생성 API 사용 안내
      return NextResponse.json({ 
        message: 'IRACING_MOCK enabled. Use /api/iracing/meta/mock to generate test data.',
        collected: 0 
      })
    }

    let collected = 0

    // 특정 subsession_id가 제공된 경우
    if (subsessionId) {
      const result = await collectSubsession(supabase, parseInt(subsessionId))
      if (result) collected++
    } else if (seriesId) {
      // 시리즈별 최근 세션들 수집
      // TODO: /data/lookup/subsessions 엔드포인트를 사용하여 시리즈별 세션 목록 가져오기
      // 현재는 단일 세션 수집만 구현
      return NextResponse.json({ 
        error: 'Series collection not implemented yet. Use subsession_id parameter.',
      }, { status: 501 })
    }

    return NextResponse.json({ 
      message: 'Collection completed',
      collected 
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'collection error'
    console.error('Meta collection error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * 단일 subsession 결과를 수집하여 DB에 저장
 */
async function collectSubsession(
  supabase: ReturnType<typeof createRouteHandlerClient>,
  subsessionId: number
): Promise<boolean> {
  try {
    // 이미 수집된 세션인지 확인
    const { data: existing } = await supabase
      .from('iracing_subsession_results')
      .select('subsession_id')
      .eq('subsession_id', subsessionId)
      .single()

    if (existing) {
      console.log(`Subsession ${subsessionId} already collected`)
      return false
    }

    // iRacing API에서 세션 결과 가져오기
    const data = await irGet<any>('/data/results/get', {
      subsession_id: subsessionId,
      include_licenses: false
    })

    if (!data || !data.results || data.results.length === 0) {
      console.warn(`No results found for subsession ${subsessionId}`)
      return false
    }

    const result = data.results[0]
    const participants: IracingParticipant[] = (data.results || []).map((r: any) => ({
      cust_id: r.cust_id,
      display_name: r.display_name || '',
      finish_position: r.finish_position || 0,
      starting_position: r.starting_position || null,
      i_rating: r.newi_rating || r.oldi_rating || null,
      i_rating_change: r.newi_rating && r.oldi_rating ? r.newi_rating - r.oldi_rating : null,
      best_lap_time: r.best_lap_time ? r.best_lap_time / 10000 : null, // 마이크로초를 초로 변환
      laps_complete: r.laps_complete || 0,
      car_id: r.car_id || 0,
      car_name: r.car_name || '',
    }))

    // 세션 메타데이터 저장
    const { error: sessionError } = await supabase
      .from('iracing_subsession_results')
      .insert({
        subsession_id: subsessionId,
        series_id: result.series_id || 0,
        season_id: result.season_id || 0,
        session_name: result.session_name || null,
        start_time: result.start_time ? new Date(result.start_time).toISOString() : new Date().toISOString(),
        track_id: result.track_id || 0,
        track_name: result.track_name || '',
      })

    if (sessionError) {
      console.error('Failed to insert subsession:', sessionError)
      throw sessionError
    }

    // 참여자 결과 저장
    const participantRecords = participants.map(p => ({
      subsession_id: subsessionId,
      cust_id: p.cust_id,
      display_name: p.display_name,
      finish_position: p.finish_position,
      starting_position: p.starting_position,
      i_rating: p.i_rating,
      best_lap_time: p.best_lap_time,
      laps_complete: p.laps_complete,
      car_id: p.car_id,
      car_name: p.car_name,
    }))

    // 배치로 저장 (1000개씩)
    const batchSize = 1000
    for (let i = 0; i < participantRecords.length; i += batchSize) {
      const batch = participantRecords.slice(i, i + batchSize)
      const { error: participantError } = await supabase
        .from('iracing_participant_results')
        .insert(batch)

      if (participantError) {
        console.error('Failed to insert participants:', participantError)
        throw participantError
      }
    }

    console.log(`Successfully collected subsession ${subsessionId} with ${participants.length} participants`)
    return true
  } catch (e) {
    console.error(`Error collecting subsession ${subsessionId}:`, e)
    throw e
  }
}
