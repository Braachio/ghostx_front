export const DRIVING_ANALYSIS_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_DRIVING_ANALYSIS || '').trim().toLowerCase() === 'true'

export const DRIVING_ANALYSIS_DISABLED_MESSAGE =
  '주행 분석 기능은 현재 점검 중입니다. 빠른 시일 내에 다시 제공될 예정입니다.'

export const TELEMETRY_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_TELEMETRY || '').trim().toLowerCase() === 'true'

export const TELEMETRY_DISABLED_MESSAGE =
  '텔레메트리 기능은 현재 점검 중입니다. 빠른 시일 내에 다시 제공될 예정입니다.'
