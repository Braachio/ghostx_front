export interface IracingDriverSummary {
  custId: string
  name: string
  country?: string | null
  irating?: number | null
  licenseClass?: string | null
}

export interface IracingDriverDetail extends IracingDriverSummary {
  safetyRating?: number | null
  licenses?: Array<{ category: string; class: string }> | null
  lastUpdated: string
}

export interface PercentileResponse {
  metric: 'irating' | 'sr'
  value: number
  global: { percentile: number; total: number }
  country?: { code: string; percentile: number; total: number }
  snapshotAt: string
}


