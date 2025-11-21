import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'
import { extractFeaturesFromRecentRaces, recommendStrategy, type ParticipantFeatures, type StrategyRecommendation, type RecentRace } from '@/lib/iracingMLFeatures'

type OpponentStrategy = {
  tags: string[] // '사고주의', '빠른페이스', '추월대상', '약한상대', '강한상대' 등
  description: string // 전략 설명
  priority: 'high' | 'medium' | 'low' // 우선순위
}

type AdvancedSummary = {
  sessionId: string
  sofEstimate?: number | null
  seriesId?: number | null
  trackId?: number | null
  participants: Array<{
    custId: string
    name: string
    country?: string | null
    irating?: number | null
    safetyRating?: number | null
    carId?: number | null
    features: ParticipantFeatures
    predictedFinish?: number | null
    predictedFinishScore?: number | null
    predictedVariants?: Record<string, {
      rank?: number | null
      predictedFinish?: number | null
      confidence?: number | null
      rawScore?: number | null
      incidentRiskLevel?: 'low' | 'medium' | 'high' | null
      incidentProbability?: number | null
      predictedRankWithIncidents?: number | null
      minRank?: number | null
      maxRank?: number | null
      analyzedFactors?: string[]
      actionableInsights?: string[]
    }>
    predictionModeUsed?: 'pre' | 'post' | null
    predictedConfidence?: number | null
    strategyRecommendation?: StrategyRecommendation | null
    // 사고 시나리오 기반 예측 (주요 예측 모드에서 사용)
    incidentRiskLevel?: 'low' | 'medium' | 'high' | null
    incidentProbability?: number | null
    predictedRankWithIncidents?: number | null
    minRank?: number | null
    maxRank?: number | null
    // 상대 전략 분석
    opponentStrategy?: OpponentStrategy | null
  }>
  overallStrategy?: StrategyRecommendation | null
  predictionModes?: {
    available: string[]
    used?: string | null
  }
  snapshotAt: string
}

const FASTAPI_BASE_URL =
  process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'

type MlParticipantPayload = {
  custId: string
  features: Record<string, number | null>
}

type RivalCard = {
  label: string
  position?: string
  offset?: string
  irGap?: string
  incidents?: string
  dnf?: string
  recent?: string
  advice?: string
}

type StrategyInsightsResult = {
  analyzedFactors: string[]
  actionableInsights: string[]
  rivalInsights?: {
    front?: RivalCard | null
    rear?: RivalCard | null
  }
}

async function fetchPythonStrategyInsights(params: {
  participants: MlParticipantPayload[]
  mainDriverCustId: string
}): Promise<StrategyInsightsResult | null> {
  const { participants, mainDriverCustId } = params
  if (!participants.length) {
    return null
  }

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/v1/predict-rank?mode=pre`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participants }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.warn(
        `[Advanced Summary] Python strategy API responded with ${response.status}: ${errorText}`,
      )
      return null
    }

    const data = await response.json().catch(() => null)
    const predictions = Array.isArray(data?.predictions) ? data.predictions : []
    const mainPrediction = predictions.find((prediction: any) => {
      const id = prediction?.custId ?? prediction?.cust_id
      return String(id) === String(mainDriverCustId)
    })

    if (!mainPrediction) {
      return null
    }

    const toStringArray = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : []

    const pickList = (...values: unknown[]) => {
      for (const val of values) {
        const arr = toStringArray(val)
        if (arr.length > 0) {
          return arr
        }
      }
      return []
    }

    const analyzedFactors = pickList(
      mainPrediction.analyzed_factors,
      mainPrediction.analyzedFactors,
    )
    const actionableInsights = pickList(
      mainPrediction.actionable_insights,
      mainPrediction.actionableInsights,
    )

    return {
      analyzedFactors,
      actionableInsights,
      rivalInsights: {
        front: mainPrediction.rival_front ?? null,
        rear: mainPrediction.rival_rear ?? null,
      },
    }
  } catch (error) {
    console.warn('[Advanced Summary] Failed to fetch strategy insights from Python API:', error)
    return null
  }
}

function computeRatingMetrics(
  meIr: number | null,
  opponentIrs: number[],
  sof: number | null
) {
  if (!opponentIrs.length) {
    return {
      avgOpponentIr: null,
      maxOpponentIr: null,
      minOpponentIr: null,
      irDiffFromAvg: null,
      irAdvantage: null,
      irRange: null,
      irRankPct: null,
      irVsMax: null,
      irVsMin: null,
      irStdEstimate: null,
      irRelativeToSof: sof && meIr ? (meIr - sof) / sof : null,
    }
  }

  const avgOpponentIr = opponentIrs.reduce((a, b) => a + b, 0) / opponentIrs.length
  const maxOpponentIr = Math.max(...opponentIrs)
  const minOpponentIr = Math.min(...opponentIrs)
  const irRange = maxOpponentIr - minOpponentIr
  const irDiffFromAvg = meIr !== null && meIr !== undefined ? meIr - avgOpponentIr : null
  const irAdvantage = irDiffFromAvg !== null ? irDiffFromAvg / 100 : null
  const irRankPct =
    meIr !== null && meIr !== undefined
      ? (meIr - minOpponentIr) / (irRange + 1)
      : null
  const irVsMax = meIr !== null && meIr !== undefined ? meIr - maxOpponentIr : null
  const irVsMin = meIr !== null && meIr !== undefined ? meIr - minOpponentIr : null
  const irStdEstimate = irRange / 4
  const irRelativeToSof =
    meIr !== null && meIr !== undefined && sof
      ? (meIr - sof) / sof
      : null

  return {
    avgOpponentIr,
    maxOpponentIr,
    minOpponentIr,
    irDiffFromAvg,
    irAdvantage,
    irRange,
    irRankPct,
    irVsMax,
    irVsMin,
    irStdEstimate,
    irRelativeToSof,
  }
}

/**
 * 상대 드라이버 전략 분석
 */
function analyzeOpponentStrategy(
  mainDriver: {
    irating?: number | null
    safetyRating?: number | null
    features?: ParticipantFeatures
    predictedFinish?: number | null
  },
  opponent: {
    custId: string
    irating?: number | null
    safetyRating?: number | null
    features?: ParticipantFeatures
    predictedFinish?: number | null
  }
): OpponentStrategy | null {
  const tags: string[] = []
  const descriptions: string[] = []
  let priority: 'high' | 'medium' | 'low' = 'low'

  const mainIR = mainDriver.irating ?? mainDriver.features?.i_rating ?? null
  const mainSR = mainDriver.safetyRating ?? mainDriver.features?.safety_rating ?? null
  const mainAvgInc = mainDriver.features?.avg_incidents_per_race ?? null
  const mainPredictedFinish = mainDriver.predictedFinish ?? null

  const oppIR = opponent.irating ?? opponent.features?.i_rating ?? null
  const oppSR = opponent.safetyRating ?? opponent.features?.safety_rating ?? null
  const oppAvgInc = opponent.features?.avg_incidents_per_race ?? null
  const oppPredictedFinish = opponent.predictedFinish ?? null

  // 1. 사고 위험도 분석
  if (oppAvgInc !== null && oppAvgInc > 0) {
    if (oppAvgInc >= 3.0) {
      tags.push('사고주의')
      descriptions.push('사고를 자주 내는 드라이버입니다. 주의가 필요합니다.')
      priority = 'high'
    } else if (oppAvgInc >= 2.0) {
      tags.push('사고주의')
      descriptions.push('사고율이 평균보다 높습니다.')
      priority = 'medium'
    }
    
    // 내 사고율과 비교
    if (mainAvgInc !== null && oppAvgInc > mainAvgInc + 1.0) {
      tags.push('사고주의')
      descriptions.push('나보다 사고를 훨씬 많이 내는 드라이버입니다.')
      priority = 'high'
    }
  }

  // 2. 페이스 분석 (iRating 기반)
  if (mainIR !== null && oppIR !== null) {
    const irDiff = oppIR - mainIR
    if (irDiff >= 300) {
      tags.push('강한상대')
      descriptions.push('iRating이 나보다 300+ 높습니다. 추월 시 주의가 필요합니다.')
      priority = 'high'
    } else if (irDiff >= 150) {
      tags.push('빠른페이스')
      descriptions.push('iRating이 나보다 높아 페이스가 빠를 수 있습니다.')
      priority = 'medium'
    } else if (irDiff <= -300) {
      tags.push('약한상대')
      descriptions.push('iRating이 나보다 300+ 낮습니다. 추월 기회가 있을 수 있습니다.')
      priority = 'medium'
    } else if (irDiff <= -150) {
      tags.push('추월대상')
      descriptions.push('iRating이 나보다 낮아 추월 가능성이 있습니다.')
      priority = 'medium'
    }
  }

  // 3. Safety Rating 분석
  if (mainSR !== null && oppSR !== null) {
    const srDiff = oppSR - mainSR
    if (srDiff <= -1.0) {
      tags.push('사고주의')
      descriptions.push('Safety Rating이 낮아 사고 위험이 높을 수 있습니다.')
      if (priority !== 'high') priority = 'medium'
    }
  }

  // 4. 예측 순위 기반 분석
  if (mainPredictedFinish !== null && oppPredictedFinish !== null) {
    const finishDiff = oppPredictedFinish - mainPredictedFinish
    if (finishDiff >= 5) {
      // 상대가 내 예상 순위보다 5등 이상 앞서면
      if (!tags.includes('강한상대')) {
        tags.push('강한상대')
        descriptions.push('예상 순위가 나보다 훨씬 앞서 있습니다.')
        priority = 'high'
      }
    } else if (finishDiff <= -5) {
      // 상대가 내 예상 순위보다 5등 이상 뒤면
      if (!tags.includes('추월대상')) {
        tags.push('추월대상')
        descriptions.push('예상 순위가 나보다 뒤에 있어 추월 기회가 있습니다.')
        priority = 'medium'
      }
    }
  }

  // 5. 랩타임 분석 (과거 데이터 기반)
  const mainBestLap = mainDriver.features?.best_lap_time ?? null
  const oppBestLap = opponent.features?.best_lap_time ?? null
  if (mainBestLap !== null && oppBestLap !== null && mainBestLap > 0 && oppBestLap > 0) {
    const lapTimeDiff = oppBestLap - mainBestLap
    if (lapTimeDiff <= -0.5) {
      // 상대가 0.5초 이상 빠름
      if (!tags.includes('빠른페이스')) {
        tags.push('빠른페이스')
        descriptions.push('과거 최고 랩타임이 나보다 빠릅니다.')
        priority = 'high'
      }
    } else if (lapTimeDiff >= 0.5) {
      // 내가 0.5초 이상 빠름
      if (!tags.includes('추월대상')) {
        tags.push('추월대상')
        descriptions.push('과거 최고 랩타임이 나보다 느립니다.')
        priority = 'medium'
      }
    }
  }

  if (tags.length === 0) {
    return null
  }

  return {
    tags: [...new Set(tags)], // 중복 제거
    description: descriptions.join(' '),
    priority,
  }
}

/**
 * 고도화된 전략 생성 (상대 드라이버 분석 결과 활용)
 */
function generateAdvancedStrategy(params: {
  baseStrategy: StrategyRecommendation
  mainDriver: {
    irating: number | null
    startingPosition: number | null
    predictedRank: number | null
    predictedRankPct: number | null
    totalParticipants: number
  }
  opponentStats: {
    highRiskCount: number
    strongOpponentCount: number
    targetOpponentCount: number
    totalOpponents: number
  }
}): StrategyRecommendation {
  const { baseStrategy, mainDriver, opponentStats } = params
  const reasoning: string[] = [...baseStrategy.reasoning]
  let strategy = baseStrategy.strategy
  let confidence = baseStrategy.confidence

  // 1. 그리드 포지션 기반 전략 조정
  // ⚠️ starting_position만 사용 (qualifying_position은 실제 그리드와 다를 수 있음)
  if (mainDriver.startingPosition !== null && mainDriver.startingPosition > 0 && mainDriver.totalParticipants > 0) {
    const gridPct = mainDriver.startingPosition / mainDriver.totalParticipants
    const gridDisplay = mainDriver.startingPosition + 1
    if (gridPct <= 0.2) {
      // 상위 20% 그리드
      reasoning.push(`그리드 ${gridDisplay}위에서 시작합니다. 좋은 출발 위치입니다.`)
      if (strategy === 'defensive') {
        strategy = 'balanced' // 방어적 전략을 균형으로 조정
        confidence = Math.min(0.9, confidence + 0.1)
      }
    } else if (gridPct >= 0.8) {
      // 하위 20% 그리드
      reasoning.push(`그리드 ${gridDisplay}위에서 시작합니다. 초반 사고에 주의하세요.`)
      if (strategy === 'aggressive') {
        strategy = 'balanced' // 공격적 전략을 균형으로 조정
      }
      confidence = Math.max(0.4, confidence - 0.1)
    } else {
      reasoning.push(`그리드 ${gridDisplay}위에서 시작합니다.`)
    }
  } else {
    // starting_position이 없으면 qualifying_position 정보만 표시 (실제 그리드가 아님)
    // 하지만 전략에는 반영하지 않음 (qualifying과 실제 그리드는 다를 수 있음)
  }

  // 2. 예상 순위 기반 전략 조정
  if (mainDriver.predictedRank !== null && mainDriver.predictedRankPct !== null) {
    if (mainDriver.predictedRankPct <= 0.2) {
      reasoning.push(`예상 순위: ${Math.round(mainDriver.predictedRank)}등 (상위 20%)`)
      if (strategy !== 'aggressive') {
        strategy = 'aggressive'
        confidence = Math.min(0.9, confidence + 0.15)
      }
    } else if (mainDriver.predictedRankPct >= 0.8) {
      reasoning.push(`예상 순위: ${Math.round(mainDriver.predictedRank)}등 (하위 20%)`)
      if (strategy !== 'defensive') {
        strategy = 'defensive'
        confidence = Math.max(0.5, confidence - 0.1)
      }
    } else {
      reasoning.push(`예상 순위: ${Math.round(mainDriver.predictedRank)}등`)
    }
  }

  // 3. 상대 드라이버 분석 기반 전략 조정
  if (opponentStats.totalOpponents > 0) {
    const highRiskPct = opponentStats.highRiskCount / opponentStats.totalOpponents
    const strongPct = opponentStats.strongOpponentCount / opponentStats.totalOpponents
    const targetPct = opponentStats.targetOpponentCount / opponentStats.totalOpponents

    // 사고 위험 드라이버가 많으면 방어적
    if (highRiskPct >= 0.3) {
      reasoning.push(`로비에 사고 위험 드라이버가 ${opponentStats.highRiskCount}명 있습니다. 초반 주의가 필요합니다.`)
      if (strategy === 'aggressive') {
        strategy = 'balanced'
      }
      confidence = Math.max(0.5, confidence - 0.1)
    } else if (highRiskPct >= 0.15) {
      reasoning.push(`사고 위험 드라이버가 ${opponentStats.highRiskCount}명 있습니다.`)
    }

    // 강한 상대가 많으면 방어적
    if (strongPct >= 0.4) {
      reasoning.push(`강한 상대가 ${opponentStats.strongOpponentCount}명으로 많습니다. 페이스 유지에 집중하세요.`)
      if (strategy === 'aggressive') {
        strategy = 'balanced'
      }
      confidence = Math.max(0.5, confidence - 0.1)
    } else if (strongPct >= 0.2) {
      reasoning.push(`강한 상대가 ${opponentStats.strongOpponentCount}명 있습니다.`)
    }

    // 추월 대상이 많으면 공격적
    if (targetPct >= 0.3) {
      reasoning.push(`추월 기회가 있는 드라이버가 ${opponentStats.targetOpponentCount}명 있습니다. 중반부 추월을 노리세요.`)
      if (strategy === 'defensive') {
        strategy = 'balanced'
      }
      confidence = Math.min(0.9, confidence + 0.1)
    } else if (targetPct >= 0.15) {
      reasoning.push(`추월 대상이 ${opponentStats.targetOpponentCount}명 있습니다.`)
    }
  }

  // 4. 단계별 전략 제안 추가
  const phaseStrategies: string[] = []
  
  // 레이스 시작 전략
  if (mainDriver.startingPosition !== null) {
    const readableStartPosition = mainDriver.startingPosition + 1
    if (mainDriver.startingPosition <= 5) {
      phaseStrategies.push(`시작: 좋은 그리드 포지션(P${readableStartPosition})입니다. 초반 페이스를 유지하며 포지션을 지키세요.`)
    } else if (mainDriver.startingPosition >= mainDriver.totalParticipants * 0.7) {
      phaseStrategies.push(`시작: 후방 그리드(P${readableStartPosition})에서 시작합니다. 초반 사고에 주의하며 안전하게 진행하세요.`)
    } else {
      phaseStrategies.push(`시작: 중간 그리드(P${readableStartPosition})에서 시작합니다. 초반 혼란을 피하며 포지션을 올리세요.`)
    }
  }

  // 중반부 전략
  if (opponentStats.targetOpponentCount > 0) {
    phaseStrategies.push(`중반부: 추월 기회가 있는 드라이버 ${opponentStats.targetOpponentCount}명을 노리세요.`)
  }
  if (opponentStats.highRiskCount > 0) {
    phaseStrategies.push(`중반부: 사고 위험 드라이버 ${opponentStats.highRiskCount}명과의 접촉을 피하세요.`)
  }

  // 후반부 전략
  if (mainDriver.predictedRankPct !== null) {
    if (mainDriver.predictedRankPct <= 0.3) {
      phaseStrategies.push(`후반부: 상위권에 있습니다. 포지션을 유지하며 완주하세요.`)
    } else if (mainDriver.predictedRankPct >= 0.7) {
      phaseStrategies.push(`후반부: 하위권입니다. 무리한 공격보다 완주에 집중하세요.`)
    } else {
      phaseStrategies.push(`후반부: 중위권입니다. 기회가 있을 때만 공격하세요.`)
    }
  }

  // reasoning에 단계별 전략 추가
  if (phaseStrategies.length > 0) {
    reasoning.push(...phaseStrategies)
  }

  return {
    strategy,
    confidence: Math.max(0.4, Math.min(0.95, confidence)),
    reasoning,
  }
}

function buildMlFeaturePayload(
  participants: Array<{
    custId: string
    irating?: number | null
    safetyRating?: number | null
    carId?: number | null
    features: ParticipantFeatures
  }>,
  options: {
    sof: number | null
    seriesId?: number | null
    trackId?: number | null
  }
) {
  const totalParticipants = participants.length || 1
  const allRatings = participants.map(
    (p) => p.irating ?? p.features?.i_rating ?? null
  )

  return participants.map((participant, index) => {
    const meIr = allRatings[index]
    const opponentIrs = allRatings
      .map((value, idx) => (idx === index ? null : value))
      .filter((val): val is number => typeof val === 'number')

    const ratingMetrics = computeRatingMetrics(meIr, opponentIrs, options.sof ?? null)
    const baseFeatures = participant.features || ({} as ParticipantFeatures)

    const derivedStartingRankPct =
      baseFeatures.starting_rank_pct ??
      (baseFeatures.starting_position !== null &&
      baseFeatures.starting_position !== undefined &&
      totalParticipants
        ? baseFeatures.starting_position / totalParticipants
        : null)

    const features: Record<string, number | null> = {
      i_rating: meIr ?? null,
      safety_rating: participant.safetyRating ?? baseFeatures.safety_rating ?? null,
      avg_incidents_per_race: baseFeatures.avg_incidents_per_race ?? null,
      dnf_rate: baseFeatures.dnf_rate ?? null,
      avg_finish_position: baseFeatures.avg_finish_position ?? null,
      recent_avg_finish_position: baseFeatures.recent_avg_finish_position ?? null,
      win_rate: baseFeatures.win_rate ?? null,
      top5_rate: baseFeatures.top5_rate ?? null,
      top10_rate: baseFeatures.top10_rate ?? null,
      ir_trend: baseFeatures.ir_trend ?? null,
      sr_trend: baseFeatures.sr_trend ?? null,
      best_lap_time: baseFeatures.best_lap_time ?? null,
      average_lap_time: baseFeatures.average_lap_time ?? null,
      lap_time_diff:
        baseFeatures.lap_time_diff ??
        (baseFeatures.average_lap_time !== null &&
        baseFeatures.average_lap_time !== undefined &&
        baseFeatures.best_lap_time !== null &&
        baseFeatures.best_lap_time !== undefined
          ? baseFeatures.average_lap_time - baseFeatures.best_lap_time
          : null),
      lap_time_consistency: baseFeatures.lap_time_consistency ?? null,
      starting_position: baseFeatures.starting_position ?? null,
      starting_rank_pct: derivedStartingRankPct,
      qualifying_position: baseFeatures.qualifying_position ?? null,
      qualifying_best_lap_time: baseFeatures.qualifying_best_lap_time ?? null,
      practice_best_lap_time: baseFeatures.practice_best_lap_time ?? null,
      fastest_qualifying_lap_time: baseFeatures.fastest_qualifying_lap_time ?? null,
      // ⚠️ fastest_race_lap_time 제거: 레이스 중에 발생하는 정보이므로 데이터 누수
      // fastest_race_lap_time: baseFeatures.fastest_race_lap_time ?? null,
      total_participants: totalParticipants,
      sof: options.sof ?? ratingMetrics.avgOpponentIr ?? null,
      avg_opponent_ir: ratingMetrics.avgOpponentIr ?? null,
      max_opponent_ir: ratingMetrics.maxOpponentIr ?? null,
      min_opponent_ir: ratingMetrics.minOpponentIr ?? null,
      ir_diff_from_avg: ratingMetrics.irDiffFromAvg ?? null,
      ir_advantage: ratingMetrics.irAdvantage ?? null,
      ir_range: ratingMetrics.irRange ?? null,
      ir_rank_pct: ratingMetrics.irRankPct ?? null,
      ir_vs_max: ratingMetrics.irVsMax ?? null,
      ir_vs_min: ratingMetrics.irVsMin ?? null,
      ir_std_estimate: ratingMetrics.irStdEstimate ?? null,
      ir_relative_to_sof: ratingMetrics.irRelativeToSof ?? null,
      series_id: options.seriesId ?? null,
      track_id: options.trackId ?? null,
      car_id: participant.carId ?? null,
      user_avg_finish_pct_much_lower: baseFeatures.user_avg_finish_pct_much_lower ?? null,
      user_avg_finish_pct_lower: baseFeatures.user_avg_finish_pct_lower ?? null,
      user_avg_finish_pct_similar: baseFeatures.user_avg_finish_pct_similar ?? null,
      user_avg_finish_pct_higher: baseFeatures.user_avg_finish_pct_higher ?? null,
      user_avg_finish_pct_much_higher: baseFeatures.user_avg_finish_pct_much_higher ?? null,
      user_ir_diff_performance_diff: baseFeatures.user_ir_diff_performance_diff ?? null,
      user_expected_finish_pct_by_ir_diff: baseFeatures.user_expected_finish_pct_by_ir_diff ?? null,
    }

    return {
      custId: participant.custId,
      features,
    }
  })
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
  
  // mainDriverCustId를 일찍 선언 (starting_position 로그에서 사용)
  const { searchParams } = new URL(req.url)
  const mainDriverCustId = searchParams.get('mainDriverCustId')
  
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
    const seriesId: number | null =
      sessionResults?.series_id ??
      sessionResults?.seriesId ??
      sessionResults?.season?.series_id ??
      null
    const trackId: number | null =
      sessionResults?.track?.track_id ?? sessionResults?.track_id ?? null

    if (sessionResults.session_results && Array.isArray(sessionResults.session_results)) {
      const raceSession = sessionResults.session_results.find((s: any) => s.simsession_number === 0)
      if (raceSession && raceSession.results) {
        raceResults = raceSession.results
      }
    } else if (sessionResults.results) {
      raceResults = sessionResults.results
    }
    
    // custId -> iRating / 차량 매핑 생성
    const iratingMap = new Map<string, number>()
    const carIdMap = new Map<string, number | null>()
    const startingPositionMap = new Map<string, number | null>()
    const fastestRaceLapMap = new Map<string, number | null>()

    const normalizeTime = (value: any) => {
      if (value === null || value === undefined) return null
      if (typeof value === 'number') return value / 10000
      const parsed = parseFloat(String(value))
      return Number.isFinite(parsed) ? parsed / 10000 : null
    }

    console.log(`[Advanced Summary] Processing ${raceResults.length} race results for starting positions`)
    raceResults.forEach((r: any) => {
      const custId = String(r.cust_id ?? r.custId ?? '')
      if (!custId) return
      // newi_rating 또는 oldi_rating 사용
      const irating = r.newi_rating ?? r.oldi_rating ?? r.i_rating ?? null
      if (irating !== null && irating !== undefined) {
        iratingMap.set(custId, irating)
      }
      if (r.car_id !== undefined && r.car_id !== null) {
        carIdMap.set(custId, Number(r.car_id))
      }
      // starting_position 추출 (여러 필드명 시도)
      const startPos = r.starting_position ?? r.gridpos ?? r.grid_position ?? r.start_pos ?? null
      if (startPos !== undefined && startPos !== null) {
        // iRacing API의 starting_position은 1-based (1 = 1위, 2 = 2위, ...)
        const pos = parseInt(String(startPos), 10)
        if (!isNaN(pos) && pos > 0) {
          startingPositionMap.set(custId, pos)
          if (mainDriverCustId && String(custId) === mainDriverCustId) {
            console.log(`[Advanced Summary] Main driver ${custId} starting position: ${pos} (from starting_position: ${r.starting_position}, gridpos: ${r.gridpos}, grid_position: ${r.grid_position})`)
          }
        }
      }
      const fastestRaceLap = normalizeTime(r.fastest_lap_time ?? r.fastestlap ?? r.best_lap_time ?? null)
      if (fastestRaceLap !== null) {
        fastestRaceLapMap.set(custId, fastestRaceLap)
      }
    })
    console.log(`[Advanced Summary] Found iRating for ${iratingMap.size} participants from session results`)

    const qualifyingMap = new Map<string, { position?: number | null; bestLapTime?: number | null; fastestLapTime?: number | null }>()
    const practiceMap = new Map<string, { bestLapTime?: number | null }>()

    const qualifyingSessions = (sessionResults.session_results ?? []).filter((s: any) => s.simsession_number === -2 || String(s.simsession_type || '').toLowerCase().includes('qual'))
    const practiceSessions = (sessionResults.session_results ?? []).filter((s: any) => s.simsession_number === -1 || String(s.simsession_type || '').toLowerCase().includes('prac'))

    qualifyingSessions.forEach((session: any) => {
      ;(session.results || []).forEach((result: any) => {
        const custId = String(result.cust_id ?? result.custId ?? '')
        if (!custId) return
        const positionRaw = result.finish_position ?? result.position ?? null
        const parsedPosition =
          positionRaw !== null && positionRaw !== undefined
            ? parseInt(String(positionRaw), 10)
            : null
        const bestLapTime = normalizeTime(result.best_lap_time ?? result.best_lap ?? null)
        const fastestLapTime = normalizeTime(result.fastest_lap_time ?? result.fastestlap ?? bestLapTime)
        const previous = qualifyingMap.get(custId) || {}
        const position =
          parsedPosition !== null
            ? Math.min(parsedPosition, previous.position ?? parsedPosition)
            : previous.position ?? null
        const bestLap =
          bestLapTime !== null
            ? Math.min(bestLapTime, previous.bestLapTime ?? bestLapTime)
            : previous.bestLapTime ?? null
        const fastestLap =
          fastestLapTime !== null
            ? Math.min(fastestLapTime, previous.fastestLapTime ?? fastestLapTime)
            : previous.fastestLapTime ?? null
        qualifyingMap.set(custId, {
          position,
          bestLapTime: bestLap,
          fastestLapTime: fastestLap,
        })
      })
    })

    practiceSessions.forEach((session: any) => {
      ;(session.results || []).forEach((result: any) => {
        const custId = String(result.cust_id ?? result.custId ?? '')
        if (!custId) return
        const bestLapTime = normalizeTime(result.best_lap_time ?? result.best_lap ?? null)
        const previous = practiceMap.get(custId) || {}
        practiceMap.set(custId, {
          bestLapTime: previous.bestLapTime ?? bestLapTime ?? null,
        })
      })
    })

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
        const qualifyingInfo = qualifyingMap.get(p.custId) || {}
        const practiceInfo = practiceMap.get(p.custId) || {}
        const fastestRaceLapTime = fastestRaceLapMap.get(p.custId) ?? null
        const startingPosition = startingPositionMap.get(p.custId) ?? null
        
        // starting_position이 없으면 qualifying_position을 fallback으로 사용하지 않음
        // (qualifying과 실제 그리드 포지션은 다를 수 있음)
        // 대신 null로 유지하고, 나중에 qualifying_position을 별도로 사용
        
        // 디버깅: starting_position 확인
        if (startingPosition !== null) {
          console.log(`[Advanced Summary] Participant ${p.custId} starting position: ${startingPosition}, qualifying position: ${qualifyingInfo.position ?? 'null'}`)
        }

        return {
          custId: p.custId,
          name: mem?.display_name || p.name,
          country: mem?.country || mem?.flair_name || null,
          irating,
          safetyRating: null, // ratings API는 404이므로 null
          carId: carIdMap.get(p.custId) ?? null,
          startingPosition,
          qualifyingPosition: qualifyingInfo.position ?? null,
          qualifyingBestLapTime: qualifyingInfo.bestLapTime ?? null,
          fastestQualifyingLapTime: qualifyingInfo.fastestLapTime ?? null,
          practiceBestLapTime: practiceInfo.bestLapTime ?? null,
          fastestRaceLapTime,
        }
      } catch (error) {
        console.error(`[Advanced Summary] Failed to get basic info for ${p.custId}:`, error)
        return {
          custId: p.custId,
          name: p.name,
          country: null,
          irating: null,
          safetyRating: null,
          carId: carIdMap.get(p.custId) ?? null,
          startingPosition: startingPositionMap.get(p.custId) ?? null,
          qualifyingPosition: null,
          qualifyingBestLapTime: null,
          fastestQualifyingLapTime: null,
          practiceBestLapTime: null,
          fastestRaceLapTime: fastestRaceLapMap.get(p.custId) ?? null,
        }
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
      carId: info.carId,
      qualifyingPosition: info.qualifyingPosition ?? null,
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
            const startPosition = info.startingPosition ?? enrichedParticipant.features?.starting_position ?? null
            const totalCount = participants.length || 1
            const startingRankPct =
              startPosition !== null && startPosition !== undefined
                ? startPosition / totalCount
                : enrichedParticipant.features?.starting_rank_pct ?? null

            const currentQualPos =
              info.qualifyingPosition ??
              (enrichedParticipant as any).qualifyingPosition ??
              enriched[index].qualifyingPosition ??
              null

            enriched[index] = {
              ...enriched[index],
              ...enrichedParticipant,
              carId: enriched[index].carId ?? info.carId ?? null,
              qualifyingPosition: currentQualPos,
              features: {
                ...enrichedParticipant.features,
                starting_position: startPosition,
                starting_rank_pct: startingRankPct,
                qualifying_position: info.qualifyingPosition ?? enrichedParticipant.features?.qualifying_position ?? null,
                qualifying_best_lap_time: info.qualifyingBestLapTime ?? enrichedParticipant.features?.qualifying_best_lap_time ?? null,
                practice_best_lap_time: info.practiceBestLapTime ?? enrichedParticipant.features?.practice_best_lap_time ?? null,
                fastest_qualifying_lap_time: info.fastestQualifyingLapTime ?? enrichedParticipant.features?.fastest_qualifying_lap_time ?? null,
                fastest_race_lap_time: info.fastestRaceLapTime ?? enrichedParticipant.features?.fastest_race_lap_time ?? null,
              },
            }
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

    // 메인 드라이버 정보 확인 (ML 예측 여부 판단)
    // mainDriverCustId는 이미 위에서 선언됨

    // 4) ML 앙상블 모델을 호출하여 순위 예측
    const mlFeaturePayload = buildMlFeaturePayload(enriched, {
      sof,
      seriesId,
      trackId,
    })

    let strategyInsightsPromise: Promise<StrategyInsightsResult | null> | null = null
    let strategyInsightsResult: StrategyInsightsResult | null = null
    if (mainDriverCustId) {
      strategyInsightsPromise = fetchPythonStrategyInsights({
        participants: mlFeaturePayload,
        mainDriverCustId: String(mainDriverCustId),
      })
    }

    const mainDriverFeature = mainDriverCustId
      ? mlFeaturePayload.find(entry => entry.custId === mainDriverCustId)
      : null

    const normalizeRivalCard = (value: any): RivalCard | null => {
      if (!value || typeof value !== 'object') return null
      const label = typeof value.label === 'string' ? value.label : null
      if (!label) return null
      const safeString = (input: any) =>
        typeof input === 'string' && input.length > 0 ? input : undefined
      return {
        label,
        position: safeString(value.position),
        offset: safeString(value.offset),
        irGap: safeString(value.irGap),
        incidents: safeString(value.incidents),
        dnf: safeString(value.dnf),
        recent: safeString(value.recent),
        advice: safeString(value.advice),
      }
    }

    const predictionVariants: Record<string, {
      rank: number | null
      predictedFinish: number | null
      confidence: number | null
      rawScore: number | null
      incidentRiskLevel?: 'low' | 'medium' | 'high' | null
      incidentProbability?: number | null
      predictedRankWithIncidents?: number | null
      minRank?: number | null
      maxRank?: number | null
      analyzedFactors?: string[]
      actionableInsights?: string[]
      rivalFront?: RivalCard | null
      rivalRear?: RivalCard | null
    }> = {}
    let primaryRivalInsights: StrategyInsightsResult['rivalInsights'] | null = null
    let predictionMeta: AdvancedSummary['predictionModes'] | undefined

    const applyPrediction = (mode: 'pre' | 'post', prediction: any) => {
      if (!prediction) return
      const rankValue = typeof prediction.rank === 'number' ? prediction.rank : null
      const scoreValue = typeof prediction.predicted_finish === 'number'
        ? prediction.predicted_finish
        : typeof prediction.raw_score === 'number'
          ? prediction.raw_score
          : null
      predictionVariants[mode] = {
        rank: rankValue ?? (scoreValue !== null ? Math.round(scoreValue) : null),
        predictedFinish: scoreValue,
        confidence: typeof prediction.confidence === 'number' ? prediction.confidence : null,
        rawScore: scoreValue,
        // 사고 시나리오 정보
        incidentRiskLevel: prediction.incident_risk_level || null,
        incidentProbability: typeof prediction.incident_probability === 'number' ? prediction.incident_probability : null,
        predictedRankWithIncidents: typeof prediction.predicted_rank_with_incidents === 'number' ? prediction.predicted_rank_with_incidents : null,
        minRank: typeof prediction.min_rank === 'number' ? prediction.min_rank : null,
        maxRank: typeof prediction.max_rank === 'number' ? prediction.max_rank : null,
        analyzedFactors: Array.isArray(prediction.analyzed_factors)
          ? prediction.analyzed_factors.filter((item: unknown): item is string => typeof item === 'string')
          : undefined,
        actionableInsights: Array.isArray(prediction.actionable_insights)
          ? prediction.actionable_insights.filter((item: unknown): item is string => typeof item === 'string')
          : undefined,
        rivalFront: normalizeRivalCard(prediction.rival_front),
        rivalRear: normalizeRivalCard(prediction.rival_rear),
      }
    }

    const requestPrediction = async (mode: 'pre' | 'post') => {
      if (!mainDriverFeature) return
      try {
        // ⚠️ 중요: 모든 참가자에 대해 예측해야 상대적인 순위를 계산할 수 있습니다
        // 단일 참가자만 보내면 항상 1등으로 나옵니다
        const mlPayload = { participants: mlFeaturePayload }
        const mlRes = await fetch(`${FASTAPI_BASE_URL}/api/ml/predict-rank?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mlPayload),
          cache: 'no-store',
        })

        if (!mlRes.ok) {
          const errorText = await mlRes.text()
          console.error(`[Advanced Summary] ML predictor (${mode}) responded with ${mlRes.status}: ${errorText}`)
          return
        }
        const mlData = await mlRes.json()
        // 메인 드라이버의 예측만 찾기
        const mainDriverPrediction = mlData?.predictions?.find(
          (p: any) => p.custId === mainDriverCustId || p.custId === String(mainDriverCustId)
        )
        if (mainDriverPrediction) {
          applyPrediction(mode, mainDriverPrediction)
          // 디버깅: 예측 점수 분포 확인
          const allScores = mlData.predictions?.map((p: any) => p.predicted_finish || p.raw_score).filter((s: any) => s !== null && s !== undefined) || []
          const minScore = Math.min(...allScores)
          const maxScore = Math.max(...allScores)
          const mainScore = mainDriverPrediction.predicted_finish || mainDriverPrediction.raw_score
          console.log(`[Advanced Summary] ML prediction (${mode}) for main driver: rank ${mainDriverPrediction.rank}/${mlData.predictions.length} (score: ${mainScore?.toFixed(2)}, range: ${minScore?.toFixed(2)}-${maxScore?.toFixed(2)})`)
        } else {
          console.warn(`[Advanced Summary] Main driver prediction not found in ML response (${mode})`)
        }
      } catch (error) {
        console.error(`[Advanced Summary] Failed to call ML predictor (${mode}):`, error)
      }
    }

    if (mainDriverCustId && mainDriverFeature) {
      await requestPrediction('pre')

      const hasGridData = Boolean(
        mainDriverFeature.features.starting_position !== null ||
        mainDriverFeature.features.starting_rank_pct !== null ||
        mainDriverFeature.features.qualifying_best_lap_time !== null ||
        mainDriverFeature.features.qualifying_position !== null
      )

      if (hasGridData) {
        await requestPrediction('post')
      }

      const target = enriched.find(p => p.custId === mainDriverCustId)
      if (target && Object.keys(predictionVariants).length > 0) {
        target.predictedVariants = predictionVariants
        let chosenMode: 'pre' | 'post' | null = null
        let chosenVariant: typeof predictionVariants.pre | typeof predictionVariants.post | null = null
        if (predictionVariants.post) {
          chosenMode = 'post'
          chosenVariant = predictionVariants.post
          target.predictedFinish = predictionVariants.post.rank ?? predictionVariants.post.predictedFinish ?? null
          target.predictedFinishScore = predictionVariants.post.predictedFinish ?? null
          target.predictedConfidence = predictionVariants.post.confidence ?? null
        } else if (predictionVariants.pre) {
          chosenMode = 'pre'
          chosenVariant = predictionVariants.pre
          target.predictedFinish = predictionVariants.pre.rank ?? predictionVariants.pre.predictedFinish ?? null
          target.predictedFinishScore = predictionVariants.pre.predictedFinish ?? null
          target.predictedConfidence = predictionVariants.pre.confidence ?? null
        }
        // 사고 시나리오 정보 추가
        if (chosenVariant) {
          target.incidentRiskLevel = chosenVariant.incidentRiskLevel ?? null
          target.incidentProbability = chosenVariant.incidentProbability ?? null
          target.predictedRankWithIncidents = chosenVariant.predictedRankWithIncidents ?? null
          target.minRank = chosenVariant.minRank ?? null
          target.maxRank = chosenVariant.maxRank ?? null
          primaryRivalInsights = {
            front: chosenVariant.rivalFront ?? null,
            rear: chosenVariant.rivalRear ?? null,
          }
        }
        target.predictionModeUsed = chosenMode
        predictionMeta = {
          available: Object.keys(predictionVariants),
          used: chosenMode ?? undefined,
        }
      }
    } else if (mainDriverCustId) {
      console.warn('[Advanced Summary] Main driver features not found; skipping ML prediction')
    }
    
    // 5) 상대 드라이버 전략 분석 (메인 드라이버가 있을 때만)
    if (mainDriverCustId) {
      const mainDriver = enriched.find(p => p.custId === mainDriverCustId)
      if (mainDriver) {
        // 각 상대 드라이버에 대해 전략 분석 수행
        enriched.forEach(opponent => {
          if (opponent.custId !== mainDriverCustId) {
            const strategy = analyzeOpponentStrategy(
              {
                irating: mainDriver.irating,
                safetyRating: mainDriver.safetyRating,
                features: mainDriver.features,
                predictedFinish: mainDriver.predictedFinish,
              },
              {
                custId: opponent.custId,
                irating: opponent.irating,
                safetyRating: opponent.safetyRating,
                features: opponent.features,
                predictedFinish: opponent.predictedFinish,
              }
            )
            if (strategy) {
              opponent.opponentStrategy = strategy
            }
          }
        })
        console.log(`[Advanced Summary] Analyzed opponent strategies for ${enriched.filter(p => p.custId !== mainDriverCustId && p.opponentStrategy).length} opponents`)
      }
    }
    
    // 6) 고도화된 전략 추천 (상대 드라이버 분석 결과 활용)
    
    let overallStrategy: StrategyRecommendation | null = null
    if (mainDriverCustId) {
      const mainDriver = enriched.find(p => p.custId === mainDriverCustId)
      if (mainDriver && mainDriver.features) {
        const opponents = enriched.filter(p => p.custId !== mainDriverCustId && p.features)
        
        // 기본 전략 추천
        const baseStrategy = recommendStrategy(mainDriver.features, opponents.map(o => o.features))
        
        // 상대 드라이버 분석 통계
        const opponentStrategies = enriched
          .filter(p => p.custId !== mainDriverCustId && p.opponentStrategy)
          .map(p => p.opponentStrategy!)
        
        const highRiskCount = opponentStrategies.filter(s => 
          s.tags.includes('사고주의') && s.priority === 'high'
        ).length
        const strongOpponentCount = opponentStrategies.filter(s => 
          s.tags.includes('강한상대') || s.tags.includes('빠른페이스')
        ).length
        const targetOpponentCount = opponentStrategies.filter(s => 
          s.tags.includes('추월대상') || s.tags.includes('약한상대')
        ).length
        
        // 그리드 포지션 정보
        // ⚠️ starting_position만 사용 (qualifying_position은 실제 그리드와 다를 수 있음)
        // 레이스 시작 전에는 starting_position이 없을 수 있으므로, 이 경우 null로 유지
        const startingPosition = mainDriver.features?.starting_position ?? null
        const qualifyingPosition = mainDriver.features?.qualifying_position ?? null
        const totalParticipants = enriched.length
        
        // starting_position이 있으면 사용, 없으면 null (qualifying_position으로 대체하지 않음)
        const gridPosition = startingPosition !== null ? startingPosition : null
        
        // 디버깅: 그리드 포지션 확인
        if (mainDriverCustId) {
          console.log(`[Advanced Summary] Main driver ${mainDriverCustId} grid position: starting=${startingPosition}, qualifying=${qualifyingPosition}, using=${gridPosition}`)
        }
        
        // 예상 순위 정보
        const predictedRank = mainDriver.predictedFinish ?? null
        const predictedRankPct = predictedRank && totalParticipants 
          ? predictedRank / totalParticipants 
          : null
        
        // 고도화된 전략 생성
        overallStrategy = generateAdvancedStrategy({
          baseStrategy,
          mainDriver: {
            irating: mainDriver.irating ?? mainDriver.features?.i_rating ?? null,
            startingPosition: gridPosition,
            predictedRank,
            predictedRankPct,
            totalParticipants,
          },
          opponentStats: {
            highRiskCount,
            strongOpponentCount,
            targetOpponentCount,
            totalOpponents: opponents.length,
          },
        })
        strategyInsightsResult = strategyInsightsPromise
          ? await strategyInsightsPromise
          : null
        console.log(`[Advanced Summary] Advanced strategy for main driver ${mainDriverCustId}:`, overallStrategy)
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

    const strategyResponse = overallStrategy
      ? {
          ...overallStrategy,
          analyzedFactors:
            strategyInsightsResult?.analyzedFactors ??
            overallStrategy.analyzedFactors ??
            [],
          actionableInsights:
            strategyInsightsResult?.actionableInsights ??
            overallStrategy.actionableInsights ??
            [],
          rivalInsights:
            strategyInsightsResult?.rivalInsights ??
            overallStrategy.rivalInsights ??
            primaryRivalInsights ??
            undefined,
        }
      : null

    const summary: AdvancedSummary = {
      sessionId,
      sofEstimate: sof,
      seriesId,
      trackId,
      participants: enriched,
      overallStrategy: strategyResponse,
      predictionModes: predictionMeta,
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

