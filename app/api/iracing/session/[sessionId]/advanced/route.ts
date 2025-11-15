import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'
import { extractFeaturesFromRecentRaces, recommendStrategy, type ParticipantFeatures, type StrategyRecommendation, type RecentRace } from '@/lib/iracingMLFeatures'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

type AdvancedSummary = {
  sessionId: string
  sofEstimate?: number | null
  participants: Array<{
    custId: string
    name: string
    country?: string | null
    irating?: number | null
    safetyRating?: number | null
    features: ParticipantFeatures
    predictedFinish?: number | null
    predictedConfidence?: number | null
    strategyRecommendation?: StrategyRecommendation | null
  }>
  overallStrategy?: StrategyRecommendation | null
  snapshotAt: string
}

const cache = new TtlCache<AdvancedSummary>(30_000)
const limiter = new IpRateLimiter(20) // 더 복잡한 요청이므로 rate limit 낮춤

/**
 * 최근 레이스 데이터 가져오기 (최대 10경기)
 */
async function fetchRecentRaces(custId: number): Promise<RecentRace[]> {
  try {
    const recentRacesData = await irGet<any>(
      '/data/stats/member_recent_races',
      { cust_id: custId }
    )

    if (!recentRacesData || !Array.isArray(recentRacesData)) {
      return []
    }

    // 최근 10경기만 사용
    const races = recentRacesData.slice(0, 10)
    
    return races.map((race: any) => ({
      finish_position: race.finish_position ?? race.finish_position_in_class ?? 0,
      incidents: race.incidents ?? race.incidents ?? 0,
      dnf: race.dnf ?? false,
      i_rating_before: race.oldi_rating ?? race.old_i_rating ?? null,
      i_rating_after: race.newi_rating ?? race.new_i_rating ?? null,
      safety_rating_before: race.old_sub_level ? race.old_sub_level / 100 : null,
      safety_rating_after: race.new_sub_level ? race.new_sub_level / 100 : null,
      session_start_time: race.session_start_time ?? race.start_time ?? new Date().toISOString(),
    }))
  } catch (error) {
    console.error(`[Advanced Summary] Failed to fetch recent races for ${custId}:`, error)
    return []
  }
}

/**
 * 참가자의 상세 통계 계산
 */
async function enrichParticipant(
  custId: string,
  name: string,
  country: string | null,
  currentIRating: number | null,
  currentSafetyRating: number | null,
  sof: number | null,
  totalParticipants: number
): Promise<{
  custId: string
  name: string
  country: string | null
  irating: number | null
  safetyRating: number | null
  features: ParticipantFeatures
  predictedFinish?: number | null
  predictedConfidence?: number | null
  strategyRecommendation?: StrategyRecommendation | null
}> {
  const custIdNum = parseInt(custId, 10)
  if (isNaN(custIdNum)) {
    return {
      custId,
      name,
      country,
      irating: currentIRating,
      safetyRating: currentSafetyRating,
      features: {
        i_rating: currentIRating,
        safety_rating: currentSafetyRating,
        avg_incidents_per_race: null,
        dnf_rate: null,
        avg_finish_position: null,
        recent_avg_finish_position: null,
        win_rate: null,
        top5_rate: null,
        top10_rate: null,
        ir_trend: null,
        sr_trend: null,
        sof,
        starting_position: null,
        total_participants: totalParticipants,
      },
    }
  }

  // 최근 레이스 데이터 가져오기
  const recentRaces = await fetchRecentRaces(custIdNum)
  
  // 최근 레이스에서 Safety Rating 가져오기 (가장 최근 레이스의 new_sub_level 사용)
  let actualSafetyRating = currentSafetyRating
  if (!actualSafetyRating && recentRaces.length > 0) {
    const latestRace = recentRaces[0]
    if (latestRace.safety_rating_after !== null && latestRace.safety_rating_after !== undefined) {
      actualSafetyRating = latestRace.safety_rating_after
    }
  }
  
  // 특성 추출
  const features = extractFeaturesFromRecentRaces(
    recentRaces,
    currentIRating,
    actualSafetyRating,
    sof,
    totalParticipants
  )

  // 개별 순위 예측은 제거 (나중에 모든 참가자를 비교하여 상대적 순위 계산)
  // 여기서는 특성만 추출하고, 순위 예측은 모든 참가자 데이터가 준비된 후에 수행
  const predictedFinish: number | null = null
  const predictedConfidence: number | null = null

  // features.i_rating과 features.safety_rating은 extractFeaturesFromRecentRaces에서 currentIRating과 currentSafetyRating을 그대로 반환하므로
  // currentIRating과 actualSafetyRating을 우선 사용
  const finalIRating = currentIRating ?? features.i_rating ?? null
  const finalSafetyRating = actualSafetyRating ?? features.safety_rating ?? null
  
  return {
    custId,
    name,
    country,
    irating: finalIRating,
    safetyRating: finalSafetyRating,
    features: {
      ...features,
      i_rating: finalIRating,
      safety_rating: finalSafetyRating,
    },
    predictedFinish,
    predictedConfidence,
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'sessionId 필요' }, { status: 400 })
  
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })

  const key = `sess:${sessionId}:advanced`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  try {
    if (IRACING_MOCK) {
      console.log(`[Advanced Summary] Using mock data for sessionId: ${sessionId}`)
      const participants = [
        {
          custId: '1001',
          name: 'Mock Kim',
          country: 'KR',
          irating: 2800,
          safetyRating: 3.9,
          features: {
            i_rating: 2800,
            safety_rating: 3.9,
            avg_incidents_per_race: 0.6,
            dnf_rate: 0.05,
            avg_finish_position: 5.2,
            recent_avg_finish_position: 4.8,
            win_rate: 0.15,
            top5_rate: 0.45,
            top10_rate: 0.75,
            ir_trend: 25,
            sr_trend: 0.05,
            sof: 2500,
            starting_position: null,
            total_participants: 20,
          },
          predictedFinish: 4,
          predictedConfidence: 0.75,
        },
      ]
      const sof = 2500
      const overallStrategy = recommendStrategy(participants[0].features, [])
      return NextResponse.json({
        sessionId,
        sofEstimate: sof,
        participants,
        overallStrategy,
        snapshotAt: new Date().toISOString(),
      })
    }

    console.log(`[Advanced Summary] Fetching advanced data for sessionId: ${sessionId}`)
    
    // 1) 기본 참가자 목록 가져오기
    const res = await fetch(`${new URL(req.url).origin}/api/iracing/session/${sessionId}/participants`)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      if (res.status === 404) {
        return NextResponse.json({
          error: errorData.error || `Subsession ${sessionId} does not exist.`,
          sessionId,
          participants: [],
          snapshotAt: new Date().toISOString(),
        }, { status: 404 })
      }
      throw new Error(errorData.error || `Failed to fetch participants: ${res.status}`)
    }
    
    const participants: Array<{ custId: string; name: string }> = await res.json()
    console.log(`[Advanced Summary] Participants count: ${participants.length}`)

    // 1.5) 세션 결과에서 직접 iRating 가져오기
    const sessionResults = await irGet<any>('/data/results/get', { subsession_id: parseInt(sessionId) })
    let raceResults: any[] = []
    if (sessionResults.session_results && Array.isArray(sessionResults.session_results)) {
      const raceSession = sessionResults.session_results.find((s: any) => s.simsession_number === 0)
      if (raceSession && raceSession.results) {
        raceResults = raceSession.results
      }
    } else if (sessionResults.results) {
      raceResults = sessionResults.results
    }
    
    // custId -> iRating 매핑 생성
    const iratingMap = new Map<string, number>()
    raceResults.forEach((r: any) => {
      const custId = String(r.cust_id)
      // newi_rating 또는 oldi_rating 사용
      const irating = r.newi_rating ?? r.oldi_rating ?? r.i_rating ?? null
      if (irating !== null && irating !== undefined) {
        iratingMap.set(custId, irating)
      }
    })
    console.log(`[Advanced Summary] Found iRating for ${iratingMap.size} participants from session results`)

    // 2) 각 참가자의 기본 정보 가져오기 (병렬)
    const basicInfo = await Promise.all(participants.map(async p => {
      try {
        const custIdNum = parseInt(p.custId, 10)
        if (isNaN(custIdNum)) {
          return { custId: p.custId, name: p.name, country: null, irating: null, safetyRating: null }
        }
        
        // 세션 결과에서 iRating 가져오기 (우선)
        let irating = iratingMap.get(p.custId) ?? null
        
        // 없으면 /data/member/get에서 가져오기 시도
        if (!irating) {
          const prof = await irGet<{
            members?: Array<{
              cust_id: number
              display_name: string
              country?: string
              flair_name?: string
              i_rating?: number
              [key: string]: any
            }>
          }>('/data/member/get', { cust_ids: custIdNum })
          
          const mem = prof?.members?.[0]
          irating = mem?.i_rating ?? null
        }
        
        // 이름과 국가는 /data/member/get에서 가져오기
        const prof = await irGet<{
          members?: Array<{
            cust_id: number
            display_name: string
            country?: string
            flair_name?: string
          }>
        }>('/data/member/get', { cust_ids: custIdNum })
        
        const mem = prof?.members?.[0]
        console.log(`[Advanced Summary] Basic info for ${p.custId}:`, {
          name: mem?.display_name || p.name,
          irating,
          fromSessionResults: iratingMap.has(p.custId),
        })
        return {
          custId: p.custId,
          name: mem?.display_name || p.name,
          country: mem?.country || mem?.flair_name || null,
          irating,
          safetyRating: null, // ratings API는 404이므로 null
        }
      } catch (error) {
        console.error(`[Advanced Summary] Failed to get basic info for ${p.custId}:`, error)
        return { custId: p.custId, name: p.name, country: null, irating: null, safetyRating: null }
      }
    }))

    // SOF 계산
    const irs = basicInfo.map(e => e.irating).filter((v): v is number => typeof v === 'number')
    const sof = irs.length ? Math.round(irs.reduce((a, b) => a + b, 0) / irs.length) : null

    // 3) 기본 정보로 먼저 응답 구성 (빠른 응답을 위해)
    // 주의: enriched 배열은 나중에 enrichParticipant로 업데이트됨
    const enriched: any[] = basicInfo.map(info => ({
      custId: info.custId,
      name: info.name,
      country: info.country,
      irating: info.irating,
      safetyRating: info.safetyRating,
      features: {
        i_rating: info.irating,
        safety_rating: info.safetyRating,
        avg_incidents_per_race: null,
        dnf_rate: null,
        avg_finish_position: null,
        recent_avg_finish_position: null,
        win_rate: null,
        top5_rate: null,
        top10_rate: null,
        ir_trend: null,
        sr_trend: null,
        sof,
        starting_position: null,
        total_participants: participants.length,
      },
      predictedFinish: null,
      predictedConfidence: null,
    }))

    // 4) 상세 통계는 병렬로 처리 (최대 5개씩 배치로 처리하여 rate limit 방지)
    const BATCH_SIZE = 5
    const BATCH_DELAY = 200 // 배치 간 딜레이
    
    for (let i = 0; i < basicInfo.length; i += BATCH_SIZE) {
      const batch = basicInfo.slice(i, i + BATCH_SIZE)
      
      const batchPromises = batch.map(async (info) => {
        try {
          console.log(`[Advanced Summary] Enriching participant ${info.custId} with:`, {
            irating: info.irating,
            safetyRating: info.safetyRating,
            sof,
            totalParticipants: participants.length,
          })
          
          const enrichedParticipant = await enrichParticipant(
            info.custId,
            info.name,
            info.country,
            info.irating,
            info.safetyRating,
            sof,
            participants.length
          )
          
          // 기존 항목 업데이트
          const index = enriched.findIndex(p => p.custId === info.custId)
          if (index >= 0) {
            enriched[index] = enrichedParticipant
            console.log(`[Advanced Summary] Enriched participant ${info.custId}:`, {
              irating: enrichedParticipant.irating,
              safetyRating: enrichedParticipant.safetyRating,
              predictedFinish: enrichedParticipant.predictedFinish,
              features_i_rating: enrichedParticipant.features?.i_rating,
              features_safety_rating: enrichedParticipant.features?.safety_rating,
            })
          }
        } catch (error) {
          console.error(`[Advanced Summary] Failed to enrich participant ${info.custId}:`, error)
          // 실패해도 기본 정보는 유지
        }
      })
      
      await Promise.all(batchPromises)
      
      // 마지막 배치가 아니면 딜레이
      if (i + BATCH_SIZE < basicInfo.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    // 4) 모든 참가자를 비교하여 상대적 순위 예측 (주요 드라이버 기준)
    const { searchParams } = new URL(req.url)
    const mainDriverCustId = searchParams.get('mainDriverCustId')
    
    // 모든 참가자의 성능 점수 계산 및 상대적 순위 예측
    if (enriched.length > 0) {
      // 각 참가자의 성능 점수 계산
      const participantsWithScore = enriched.map(p => {
        if (!p.features || !p.features.i_rating) {
          return { ...p, performanceScore: 0 }
        }
        
        const features = p.features
        
        // 1. iRating 점수 (SOF 대비)
        let irScore = 0
        if (features.i_rating && features.sof) {
          const irDiff = features.i_rating - features.sof
          irScore = irDiff / 100 // 정규화
        }
        
        // 2. 최근 성적 점수 (평균 순위가 낮을수록 좋음)
        let recentScore = 0
        if (features.recent_avg_finish_position && features.total_participants) {
          const percentile = features.recent_avg_finish_position / features.total_participants
          recentScore = (1 - percentile) * 2 // 0~2 범위로 정규화
        }
        
        // 3. 인시던트 패널티 (인시던트가 적을수록 좋음)
        let incidentScore = 0
        if (features.avg_incidents_per_race !== null) {
          incidentScore = Math.max(0, 1 - features.avg_incidents_per_race / 10) // 0~1 범위
        }
        
        // 4. DNF율 패널티
        let dnfScore = 0
        if (features.dnf_rate !== null) {
          dnfScore = 1 - features.dnf_rate // 0~1 범위
        }
        
        // 5. IR 추세 점수
        let trendScore = 0
        if (features.ir_trend !== null) {
          trendScore = Math.max(-1, Math.min(1, features.ir_trend / 100)) // -1~1 범위
        }
        
        // 가중 평균으로 최종 성능 점수 계산
        const performanceScore = 
          irScore * 0.4 +           // iRating이 가장 중요
          recentScore * 0.3 +       // 최근 성적
          incidentScore * 0.15 +    // 인시던트
          dnfScore * 0.1 +          // DNF율
          trendScore * 0.05         // 추세
        
        return { ...p, performanceScore }
      })
      
      // 성능 점수 순으로 정렬 (높을수록 좋은 순위)
      participantsWithScore.sort((a, b) => b.performanceScore - a.performanceScore)
      
      // 정렬된 순서대로 순위 할당
      participantsWithScore.forEach((p, index) => {
        const originalIndex = enriched.findIndex(orig => orig.custId === p.custId)
        if (originalIndex >= 0) {
          enriched[originalIndex].predictedFinish = index + 1
          
          // 신뢰도 계산 (데이터 완성도 기반)
          const dataCompleteness = [
            p.features?.i_rating !== null,
            p.features?.recent_avg_finish_position !== null,
            p.features?.avg_incidents_per_race !== null,
          ].filter(Boolean).length / 3
          
          enriched[originalIndex].predictedConfidence = Math.max(0.4, Math.min(0.9, dataCompleteness))
        }
      })
      
      const mainDriverInfo = mainDriverCustId 
        ? participantsWithScore.find(p => p.custId === mainDriverCustId)
        : null
      
      console.log(`[Advanced Summary] Predicted ranks${mainDriverCustId ? ` (main driver: ${mainDriverCustId})` : ''}:`, 
        participantsWithScore.slice(0, 5).map(p => ({
          name: p.name,
          score: p.performanceScore.toFixed(2),
          rank: enriched.find(e => e.custId === p.custId)?.predictedFinish,
          isMainDriver: p.custId === mainDriverCustId
        }))
      )
      
      if (mainDriverInfo) {
        console.log(`[Advanced Summary] Main driver predicted rank: ${enriched.find(e => e.custId === mainDriverCustId)?.predictedFinish}`)
      }
    }
    
    // 5) 전체 전략 추천 (사용자가 선택한 드라이버가 있으면 해당 드라이버 기준, 없으면 평균)
    
    let overallStrategy: StrategyRecommendation | null = null
    if (mainDriverCustId) {
      const mainDriver = enriched.find(p => p.custId === mainDriverCustId)
      if (mainDriver && mainDriver.features) {
        const opponents = enriched.filter(p => p.custId !== mainDriverCustId && p.features)
        overallStrategy = recommendStrategy(mainDriver.features, opponents.map(o => o.features))
        console.log(`[Advanced Summary] Strategy for main driver ${mainDriverCustId}:`, overallStrategy)
      }
    }
    
    // mainDriverCustId가 없거나 해당 드라이버를 찾지 못한 경우, 평균 특성으로 전략 추천
    if (!overallStrategy && enriched.length > 0) {
      const driversWithFeatures = enriched.filter(p => p.features && p.features.i_rating !== null)
      if (driversWithFeatures.length > 0) {
        // 평균 특성 계산
        const avgIR = driversWithFeatures
          .map(p => p.features!.i_rating!)
          .reduce((a, b) => a + b, 0) / driversWithFeatures.length
        
        const avgIncidents = driversWithFeatures
          .map(p => p.features!.avg_incidents_per_race)
          .filter((v): v is number => v !== null)
        const avgInc = avgIncidents.length > 0
          ? avgIncidents.reduce((a, b) => a + b, 0) / avgIncidents.length
          : null
        
        const avgDnfRate = driversWithFeatures
          .map(p => p.features!.dnf_rate)
          .filter((v): v is number => v !== null)
        const avgDnf = avgDnfRate.length > 0
          ? avgDnfRate.reduce((a, b) => a + b, 0) / avgDnfRate.length
          : null
        
        const avgRecentPos = driversWithFeatures
          .map(p => p.features!.recent_avg_finish_position)
          .filter((v): v is number => v !== null)
        const avgPos = avgRecentPos.length > 0
          ? avgRecentPos.reduce((a, b) => a + b, 0) / avgRecentPos.length
          : null
        
        const avgFeatures: ParticipantFeatures = {
          i_rating: Math.round(avgIR),
          safety_rating: null,
          avg_incidents_per_race: avgInc,
          dnf_rate: avgDnf,
          avg_finish_position: null,
          recent_avg_finish_position: avgPos,
          win_rate: null,
          top5_rate: null,
          top10_rate: null,
          ir_trend: null,
          sr_trend: null,
          sof,
          starting_position: null,
          total_participants: participants.length,
        }
        overallStrategy = recommendStrategy(avgFeatures, driversWithFeatures.map(p => p.features!))
        console.log(`[Advanced Summary] Strategy for average driver:`, overallStrategy)
      }
    }

    const summary: AdvancedSummary = {
      sessionId,
      sofEstimate: sof,
      participants: enriched,
      overallStrategy,
      snapshotAt: new Date().toISOString(),
    }

    console.log(`[Advanced Summary] Final summary:`, {
      sessionId: summary.sessionId,
      sofEstimate: summary.sofEstimate,
      participantsCount: summary.participants.length,
      overallStrategy: summary.overallStrategy?.strategy,
    })

    cache.set(key, summary, 20_000)
    return NextResponse.json(summary)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    console.error(`[Advanced Summary] Error:`, msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

