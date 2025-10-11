// 이벤트 타입 정의
export type EventType = 
  | 'regular_schedule'  // 정기 멀티 (고정)
  | 'always_on_server'  // 상시 서버 (고정)
  | 'league'           // 리그 (고정)
  | 'flash_event'      // 기습갤멀 (일회성)

// 이벤트 템플릿 인터페이스
export interface EventTemplate {
  id: string
  type: EventType
  game: string
  track: string
  class: string
  time: string
  days: string[]
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// 확장된 Multi 인터페이스
export interface MultiWithTemplate {
  id: string
  title: string
  game: string
  game_track: string
  multi_class: string
  multi_day: string[]
  multi_time?: string | null
  multi_race?: string | null
  is_open: boolean | null
  description?: string | null
  link?: string | null
  author_id?: string | null
  anonymous_nickname?: string | null
  anonymous_password?: string | null
  created_at?: string | null
  updated_at?: string | null
  year?: number | null
  week?: number | null
  event_date?: string | null
  // 새로운 필드들
  event_type: EventType
  is_template_based: boolean
  template_id?: string | null
  // 템플릿 정보 (조인된 경우)
  template?: EventTemplate
}

// 이벤트 타입별 표시 옵션
export const EventTypeConfig = {
  regular_schedule: {
    label: '정기 멀티',
    icon: '📅',
    color: 'blue',
    description: '매주 정기적으로 진행되는 멀티플레이 이벤트'
  },
  always_on_server: {
    label: '상시 서버',
    icon: '🖥️',
    color: 'green',
    description: '24시간 운영되는 상시 서버'
  },
  league: {
    label: '리그',
    icon: '🏆',
    color: 'purple',
    description: '정기적으로 진행되는 리그 이벤트'
  },
  flash_event: {
    label: '기습갤멀',
    icon: '⚡',
    color: 'orange',
    description: '일회성 갤러리 멀티플레이 이벤트'
  }
} as const

// 요일 매핑
export const DayMapping = {
  '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7
} as const

export type DayName = keyof typeof DayMapping
