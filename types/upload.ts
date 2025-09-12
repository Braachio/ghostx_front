export interface CornerEntryFeedback {
  start_idx: number 
  end_idx: number
  corner_index: number
  feedback: string
  avg_brake_pressure: number
  brake_duration: number
  steer_variability: number
}

export interface CornerExitFeedback {
  start_idx: number 
  end_idx: number
  corner_index: number
  feedback: string
  max_slip_ratio: number
}

export interface SectorResult {
  sector_index: number
  duration: number
  avg_speed: number
  // 필요에 따라 필드 추가 가능
}

export interface ResultType {
  lap_id: string
  track: string
  car: string
  data?: Array<Record<string, number>>
  sector_results?: SectorResult[]        
  corner_exit_analysis: CornerExitFeedback[] 
  corner_entry_analysis?: CornerEntryFeedback[]
}

export interface LapMeta {
  id: string
  user_id: string
  track: string
  car: string
  created_at: string
  display_name: string
  hash: string
  lap_time?: number
}
