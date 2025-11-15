export interface IracingDriverSummary {
  custId: string
  name: string
  country?: string | null
  irating?: number | null
  licenseClass?: string | null
}

export interface DriverTrendPoint {
  date: string
  irating?: number | null
  safetyRating?: number | null
}

export interface DriverStrength {
  label: string
  type: 'series' | 'track' | 'car'
  starts?: number | null
  winRate?: number | null
  avgFinish?: number | null
  bestResult?: number | null
}

export interface DriverPerformanceSnapshot {
  totalStarts?: number | null
  wins?: number | null
  podiums?: number | null
  top5?: number | null
  winRate?: number | null
  podiumRate?: number | null
  top5Rate?: number | null
  avgFinish?: number | null
  avgIncidents?: number | null
  cleanRaceRate?: number | null
}

export interface DriverRecentRace {
  subsessionId: number | string
  seriesName?: string | null
  startTime?: string | null
  track?: string | null
  car?: string | null
  finishPosition?: number | null
  startPosition?: number | null
  iratingChange?: number | null
  incidents?: number | null
  lapsLed?: number | null
  strengthOfField?: number | null
  safetyRatingAfter?: number | null
  safetyRatingBefore?: number | null
}

export interface DriverConsistencyMetrics {
  avgIncidents?: number | null
  cleanRaceRate?: number | null
  dnfRate?: number | null
  avgLaps?: number | null
  strengthOfField?: number | null
}

export interface DriverHighlight {
  type?: 'careerWins' | 'winRate' | 'recentBestFinish' | 'maxIrGain' | 'custom'
  title: string
  description: string
  timestamp?: string
  data?: Record<string, unknown>
}

export interface IracingDriverDetail extends IracingDriverSummary {
  safetyRating?: number | null
  licenses?: Array<{ category: string; class: string }> | null
  lastUpdated: string
  performance?: DriverPerformanceSnapshot | null
  trends?: DriverTrendPoint[] | null
  strengths?: DriverStrength[] | null
  recentRaces?: DriverRecentRace[] | null
  consistency?: DriverConsistencyMetrics | null
  highlights?: DriverHighlight[] | null
  categoryId?: number | null // 현재 표시 중인 카테고리 ID (1=Oval, 2=Road, 3=Dirt Oval, 4=Dirt Road, 5=Sports Car, 6=Formula Car)
  warning?: string | null // 경고 메시지 (예: 최근 레이스가 없어서 iRating/Safety Rating을 표시할 수 없음)
}

export interface PercentileResponse {
  metric: 'irating' | 'sr'
  value: number
  global: { percentile: number; total: number }
  country?: { code: string; percentile: number; total: number }
  snapshotAt: string
}

// 메타 차량 데이터 분석 타입
export interface IracingParticipant {
  cust_id: number
  display_name: string
  finish_position: number
  starting_position: number | null
  i_rating: number | null
  i_rating_change: number | null
  best_lap_time: number | null
  laps_complete: number
  car_id: number
  car_name: string
}

export interface IracingSubsessionResult {
  subsession_id: number
  series_id: number
  season_id: number
  session_name: string | null
  start_time: string
  track_id: number
  track_name: string
  participants: IracingParticipant[]
}

export interface MetaVehicleStats {
  car_id: number
  car_name: string
  series_id: number
  series_name: string
  track_id: number | null
  track_name: string | null
  period_start: string
  period_end: string
  
  // 통계
  total_races: number
  total_participants: number
  wins: number
  win_rate: number  // %
  top5_finishes: number
  top5_rate: number  // %
  pick_rate: number  // %
  avg_lap_time: number | null
  avg_irating_gain: number | null  // 제한적
  irating_bins: Record<string, { avg_lap_time: number; count: number }>  // iRating 구간별 평균 랩타임
}

export interface BopAlert {
  car_id: number
  car_name: string
  series_id: number
  series_name: string
  patch_date: string
  win_rate_change: number  // %
  pick_rate_change: number  // %
  top5_rate_change: number  // %
  alert_type: 'surge' | 'drop'
}

// 텔레메트리 데이터 수집 타입
export interface TelemetrySession {
  id?: string
  user_id: string
  session_name?: string
  track_id?: number
  track_name?: string
  car_id?: number
  car_name?: string
  session_type?: 'practice' | 'qualifying' | 'race' | 'time_trial'
  start_time: string
  end_time?: string
  duration_seconds?: number
  sample_count?: number
  sample_rate_hz?: number
  data_hash?: string
  is_complete?: boolean
  notes?: Record<string, unknown>
}

export interface TelemetrySample {
  elapsed_time: number  // 세션 시작부터의 경과 시간 (초)
  
  // 1. 제어 입력 (Control Inputs)
  throttle_position?: number  // 0.0 ~ 1.0
  brake_position?: number  // 0.0 ~ 1.0
  steering_angle?: number  // 라디안 또는 도
  clutch_position?: number  // 0.0 ~ 1.0
  
  // 2. 차량 상태
  speed_ms?: number  // m/s
  speed_kmh?: number  // km/h
  rpm?: number
  gear?: number
  engine_power?: number  // kW
  engine_torque?: number  // N⋅m
  
  // 3. GPS/위치
  position_x?: number  // 트랙 위치 X (미터)
  position_y?: number  // 트랙 위치 Y (미터)
  position_z?: number  // 트랙 위치 Z (미터)
  latitude?: number
  longitude?: number
  heading?: number  // 방향 (도)
  distance_lap?: number  // 랩 시작부터의 거리 (미터)
  
  // 4. 타이어 데이터
  tire_temp_fl?: number  // 전좌 (Celsius)
  tire_temp_fr?: number
  tire_temp_rl?: number
  tire_temp_rr?: number
  tire_pressure_fl?: number  // kPa
  tire_pressure_fr?: number
  tire_pressure_rl?: number
  tire_pressure_rr?: number
  tire_wear_fl?: number  // 0.0 ~ 1.0
  tire_wear_fr?: number
  tire_wear_rl?: number
  tire_wear_rr?: number
  
  // 5. 서스펜션
  suspension_travel_fl?: number  // mm
  suspension_travel_fr?: number
  suspension_travel_rl?: number
  suspension_travel_rr?: number
  ride_height_fl?: number  // mm
  ride_height_fr?: number
  ride_height_rl?: number
  ride_height_rr?: number
  
  // 6. G-Force
  g_force_lateral?: number  // 횡방향 G
  g_force_longitudinal?: number  // 종방향 G
  g_force_vertical?: number  // 수직 G
  
  // 7. 슬립/트랙션
  wheel_slip_fl?: number
  wheel_slip_fr?: number
  wheel_slip_rl?: number
  wheel_slip_rr?: number
  
  // 8. 브레이크/ABS
  brake_temperature_fl?: number
  brake_temperature_fr?: number
  brake_temperature_rl?: number
  brake_temperature_rr?: number
  abs_active?: boolean
  traction_control_active?: boolean
  
  // 9. 추가 메타데이터
  lap_number?: number
  sector_number?: number
  fuel_level?: number  // 리터
  fuel_pressure?: number  // kPa
}

export interface TelemetryUploadRequest {
  session?: TelemetrySession  // session_id가 있으면 선택적
  session_id?: string  // 기존 세션에 샘플 추가 시 사용
  samples: TelemetrySample[]
}

export interface TelemetryUploadResponse {
  session_id: string
  samples_inserted: number
  message: string
}


