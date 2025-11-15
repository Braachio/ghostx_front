/**
 * iRacing ML 모델을 위한 특성 추출 유틸리티
 */

export interface ParticipantFeatures {
  // 기본 레이팅
  i_rating: number | null
  safety_rating: number | null
  
  // 통계 (최근 N경기)
  avg_incidents_per_race: number | null
  dnf_rate: number | null // DNF율 (무사 완주율 = 1 - dnf_rate)
  avg_finish_position: number | null
  recent_avg_finish_position: number | null // 최근 5경기 평균
  win_rate: number | null
  top5_rate: number | null
  top10_rate: number | null
  
  // 변화 추세
  ir_trend: number | null // 최근 IR 변화율
  sr_trend: number | null // 최근 SR 변화율
  
  // 세션 컨텍스트
  sof: number | null // Strength of Field
  starting_position: number | null
  total_participants: number
}

export interface RecentRace {
  finish_position: number
  incidents: number
  dnf: boolean
  i_rating_before: number | null
  i_rating_after: number | null
  safety_rating_before: number | null
  safety_rating_after: number | null
  session_start_time: string
}

/**
 * 최근 레이스 데이터로부터 통계 특성 추출
 */
export function extractFeaturesFromRecentRaces(
  recentRaces: RecentRace[],
  currentIRating: number | null,
  currentSafetyRating: number | null,
  sof: number | null,
  totalParticipants: number,
  startingPosition: number | null = null
): ParticipantFeatures {
  if (recentRaces.length === 0) {
    return {
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
      starting_position: startingPosition,
      total_participants: totalParticipants,
    }
  }

  // 최근 5경기만 사용
  const recent5 = recentRaces.slice(0, 5)
  
  // 평균 인시던트
  const incidents = recent5.map(r => r.incidents).filter((v): v is number => typeof v === 'number')
  const avg_incidents_per_race = incidents.length > 0
    ? incidents.reduce((a, b) => a + b, 0) / incidents.length
    : null

  // DNF율
  const dnfCount = recent5.filter(r => r.dnf).length
  const dnf_rate = recent5.length > 0 ? dnfCount / recent5.length : null

  // 평균 완주 순위
  const finishPositions = recent5
    .filter(r => !r.dnf)
    .map(r => r.finish_position)
    .filter((v): v is number => typeof v === 'number')
  const avg_finish_position = finishPositions.length > 0
    ? finishPositions.reduce((a, b) => a + b, 0) / finishPositions.length
    : null

  // 최근 5경기 평균 완주 순위
  const recent_avg_finish_position = finishPositions.length > 0
    ? finishPositions.reduce((a, b) => a + b, 0) / finishPositions.length
    : null

  // 우승률, Top5율, Top10율
  const wins = recent5.filter(r => r.finish_position === 1 && !r.dnf).length
  const top5 = recent5.filter(r => r.finish_position <= 5 && !r.dnf).length
  const top10 = recent5.filter(r => r.finish_position <= 10 && !r.dnf).length
  const completed = recent5.filter(r => !r.dnf).length
  
  const win_rate = completed > 0 ? wins / completed : null
  const top5_rate = completed > 0 ? top5 / completed : null
  const top10_rate = completed > 0 ? top10 / completed : null

  // IR/SR 변화 추세 계산
  let ir_trend: number | null = null
  let sr_trend: number | null = null

  if (recent5.length >= 2) {
    // 최근 2경기의 IR/SR 변화를 기반으로 추세 계산
    const latest = recent5[0]
    const previous = recent5[1]
    
    if (latest.i_rating_after !== null && previous.i_rating_before !== null) {
      ir_trend = latest.i_rating_after - previous.i_rating_before
    } else if (latest.i_rating_after !== null && latest.i_rating_before !== null) {
      ir_trend = latest.i_rating_after - latest.i_rating_before
    }
    
    if (latest.safety_rating_after !== null && previous.safety_rating_before !== null) {
      sr_trend = latest.safety_rating_after - previous.safety_rating_before
    } else if (latest.safety_rating_after !== null && latest.safety_rating_before !== null) {
      sr_trend = latest.safety_rating_after - latest.safety_rating_before
    }
  }

  return {
    i_rating: currentIRating,
    safety_rating: currentSafetyRating,
    avg_incidents_per_race,
    dnf_rate,
    avg_finish_position,
    recent_avg_finish_position,
    win_rate,
    top5_rate,
    top10_rate,
    ir_trend,
    sr_trend,
    sof,
    starting_position: startingPosition,
    total_participants: totalParticipants,
  }
}

/**
 * 특성을 ML 모델 입력 형식으로 변환 (null 값 처리 포함)
 */
export function featuresToMLInput(features: ParticipantFeatures): number[] {
  return [
    features.i_rating ?? 0,
    features.safety_rating ?? 0,
    features.avg_incidents_per_race ?? 0,
    features.dnf_rate ?? 0,
    features.avg_finish_position ?? features.total_participants / 2,
    features.recent_avg_finish_position ?? features.total_participants / 2,
    features.win_rate ?? 0,
    features.top5_rate ?? 0,
    features.top10_rate ?? 0,
    features.ir_trend ?? 0,
    features.sr_trend ?? 0,
    features.sof ?? features.i_rating ?? 0,
    features.starting_position ?? features.total_participants / 2,
    features.total_participants,
  ]
}

/**
 * 전략 추천 로직 (규칙 기반, 향후 ML 모델로 대체 가능)
 */
export type StrategyType = 'aggressive' | 'balanced' | 'defensive' | 'survival'

export interface StrategyRecommendation {
  strategy: StrategyType
  confidence: number
  reasoning: string[]
}

export function recommendStrategy(
  myFeatures: ParticipantFeatures,
  opponentsFeatures: ParticipantFeatures[]
): StrategyRecommendation {
  const reasoning: string[] = []
  let aggressiveScore = 0
  let defensiveScore = 0

  // 내 IR이 SOF보다 높으면 공격적
  if (myFeatures.i_rating && myFeatures.sof) {
    const irDiff = myFeatures.i_rating - myFeatures.sof
    if (irDiff > 200) {
      aggressiveScore += 2
      reasoning.push(`내 iRating이 SOF보다 ${irDiff} 높습니다`)
    } else if (irDiff < -200) {
      defensiveScore += 2
      reasoning.push(`내 iRating이 SOF보다 ${Math.abs(irDiff)} 낮습니다`)
    }
  }

  // 최근 성적이 좋으면 공격적
  if (myFeatures.recent_avg_finish_position && myFeatures.total_participants) {
    const recentRankPercent = (myFeatures.recent_avg_finish_position / myFeatures.total_participants) * 100
    if (recentRankPercent < 30) {
      aggressiveScore += 1.5
      reasoning.push('최근 평균 순위가 상위 30%입니다')
    } else if (recentRankPercent > 70) {
      defensiveScore += 1.5
      reasoning.push('최근 평균 순위가 하위 30%입니다')
    }
  }

  // IR 상승 추세면 공격적
  if (myFeatures.ir_trend && myFeatures.ir_trend > 50) {
    aggressiveScore += 1
    reasoning.push('iRating이 상승 추세입니다')
  } else if (myFeatures.ir_trend && myFeatures.ir_trend < -50) {
    defensiveScore += 1
    reasoning.push('iRating이 하락 추세입니다')
  }

  // 상대방 평균 IR이 높으면 방어적
  const avgOpponentIR = opponentsFeatures
    .map(o => o.i_rating)
    .filter((v): v is number => v !== null)
  if (avgOpponentIR.length > 0) {
    const avgIR = avgOpponentIR.reduce((a, b) => a + b, 0) / avgOpponentIR.length
    if (myFeatures.i_rating && myFeatures.i_rating < avgIR - 300) {
      defensiveScore += 1.5
      reasoning.push('상대방 평균 iRating이 높습니다')
    }
  }

  // 인시던트율이 높으면 방어적
  if (myFeatures.avg_incidents_per_race && myFeatures.avg_incidents_per_race > 5) {
    defensiveScore += 1
    reasoning.push('평균 인시던트가 높습니다')
  }

  // DNF율이 높으면 생존 모드
  if (myFeatures.dnf_rate && myFeatures.dnf_rate > 0.3) {
    defensiveScore += 2
    reasoning.push('DNF율이 높아 완주에 집중하세요')
  }

  // 점수에 따라 전략 결정
  let strategy: StrategyType
  let confidence: number

  // 더 세밀한 점수 기준
  if (defensiveScore >= 4) {
    strategy = myFeatures.dnf_rate && myFeatures.dnf_rate > 0.3 ? 'survival' : 'defensive'
    confidence = Math.min(0.9, 0.5 + (defensiveScore - 4) * 0.1)
  } else if (aggressiveScore >= 3) {
    strategy = 'aggressive'
    confidence = Math.min(0.9, 0.5 + (aggressiveScore - 3) * 0.1)
  } else if (defensiveScore > aggressiveScore && defensiveScore >= 2) {
    strategy = 'defensive'
    confidence = 0.6 + (defensiveScore - 2) * 0.1
  } else if (aggressiveScore > defensiveScore && aggressiveScore >= 2) {
    strategy = 'aggressive'
    confidence = 0.6 + (aggressiveScore - 2) * 0.1
  } else {
    strategy = 'balanced'
    confidence = 0.5
  }

  // reasoning이 없으면 기본 메시지 추가
  if (reasoning.length === 0) {
    if (myFeatures.i_rating && myFeatures.sof) {
      const irDiff = myFeatures.i_rating - myFeatures.sof
      if (Math.abs(irDiff) < 100) {
        reasoning.push('iRating이 SOF와 비슷합니다')
      } else if (irDiff > 0) {
        reasoning.push(`iRating이 SOF보다 ${Math.round(irDiff)} 높습니다`)
      } else {
        reasoning.push(`iRating이 SOF보다 ${Math.round(Math.abs(irDiff))} 낮습니다`)
      }
    }
    if (myFeatures.recent_avg_finish_position && myFeatures.total_participants) {
      const rankPercent = (myFeatures.recent_avg_finish_position / myFeatures.total_participants) * 100
      if (rankPercent < 40) {
        reasoning.push('최근 평균 순위가 상위권입니다')
      } else if (rankPercent > 60) {
        reasoning.push('최근 평균 순위가 하위권입니다')
      }
    }
    if (reasoning.length === 0) {
      reasoning.push('균형 잡힌 로비입니다')
    }
  }

  return { strategy, confidence, reasoning }
}

