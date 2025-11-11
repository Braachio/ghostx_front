# iRacing 메타 차량 데이터 분석 - 구현 가능 여부 및 방법

## ✅ 구현 가능한 기능

### 1. 시리즈/트랙별 "메타 리포트"

#### ✅ 구현 가능한 지표:

**승률 (Win Rate)**
- iRacing Data API: `/data/results/get`
- 세션 결과에서 `finish_position = 1`인 차량을 집계
- 계산: `(해당 차량 우승 횟수) / (해당 차량 총 참여 횟수) * 100`

**픽률 (Pick Rate)**
- 세션 참여자 데이터에서 각 차량 선택 비율 계산
- 계산: `(해당 차량 선택한 드라이버 수) / (총 드라이버 수) * 100`

**Top 5 피니시율 (Top 5 Rate)**
- `finish_position <= 5`인 차량 집계
- 계산: `(Top 5 완주 횟수) / (총 참여 횟수) * 100`

**평균 iRating 증감**
- ⚠️ **제한사항**: iRacing API는 세션 전후 iRating을 직접 제공하지 않음
- **대안**: 
  - 세션 결과에 포함된 드라이버의 iRating을 기록
  - 동일 드라이버의 다음 세션 iRating과 비교
  - 또는 `/data/member/ratings`로 시간별 iRating 변화 추적 (제한적)

**iRating 대비 평균 랩타임**
- 세션 결과에서 `best_lap_time`과 드라이버의 `i_rating`을 매칭
- 동일 iRating 구간(예: 2000-2100)에서 차량별 평균 랩타임 비교

### 2. BoP 패치에 따른 "급상승 차량" 알림

#### ✅ 구현 가능:
- 시리즈별로 시간에 따라 메타 데이터를 수집
- 패치 날짜를 기준으로 전후 비교
- 픽률/승률 변화율 계산
- 임계값(예: 20% 상승) 이상이면 알림

---

## 🔧 구현 방법

### 1. API 엔드포인트 구조

```typescript
// ghostx_front/lib/iracingTypes.ts에 추가
export interface SubsessionResult {
  subsession_id: number
  series_id: number
  season_id: number
  session_name: string
  start_time: string
  track_id: number
  track_name: string
  car_id: number
  car_name: string
  participants: Array<{
    cust_id: number
    display_name: string
    finish_position: number
    starting_position: number
    i_rating: number
    i_rating_change: number | null  // API에서 제공되지 않을 수 있음
    best_lap_time: number | null
    laps_complete: number
    car_id: number
    car_name: string
  }>
}

export interface MetaVehicleStats {
  car_id: number
  car_name: string
  series_id: number
  series_name: string
  track_id: number
  track_name: string
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
```

### 2. 데이터 수집 API 엔드포인트

```typescript
// ghostx_front/app/api/iracing/meta/collect/route.ts (새로 생성)
// 시리즈별 세션 결과를 수집하여 메타 데이터 생성
```

### 3. 메타 리포트 조회 API

```typescript
// ghostx_front/app/api/iracing/meta/report/route.ts (새로 생성)
// 시리즈/트랙별 메타 리포트 조회
```

### 4. BoP 패치 알림 API

```typescript
// ghostx_front/app/api/iracing/meta/bop-alerts/route.ts (새로 생성)
// 급상승 차량 알림 조회
```

### 5. 데이터베이스 스키마

```sql
-- 메타 차량 통계 테이블
CREATE TABLE iracing_meta_vehicle_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id INTEGER NOT NULL,
  car_name TEXT NOT NULL,
  series_id INTEGER NOT NULL,
  series_name TEXT NOT NULL,
  track_id INTEGER,
  track_name TEXT,
  
  -- 기간
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- 통계
  total_races INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  top5_finishes INTEGER NOT NULL DEFAULT 0,
  top5_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  pick_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  avg_lap_time DECIMAL(10, 3),
  
  -- iRating 구간별 통계 (JSONB)
  irating_bins JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(car_id, series_id, track_id, period_start, period_end)
);

-- 세션 결과 원본 데이터 (상세 분석용)
CREATE TABLE iracing_subsession_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subsession_id INTEGER UNIQUE NOT NULL,
  series_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  session_name TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  track_id INTEGER NOT NULL,
  track_name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_series_time (series_id, start_time),
  INDEX idx_track_time (track_id, start_time)
);

-- 참여자 결과
CREATE TABLE iracing_participant_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subsession_id INTEGER NOT NULL REFERENCES iracing_subsession_results(subsession_id),
  cust_id INTEGER NOT NULL,
  display_name TEXT,
  finish_position INTEGER NOT NULL,
  starting_position INTEGER,
  i_rating INTEGER,
  best_lap_time DECIMAL(10, 3),
  laps_complete INTEGER,
  car_id INTEGER NOT NULL,
  car_name TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_subsession (subsession_id),
  INDEX idx_car_series (car_id, subsession_id)
);

-- BoP 패치 이력
CREATE TABLE iracing_bop_patches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patch_date TIMESTAMPTZ NOT NULL,
  series_id INTEGER,
  description TEXT,
  notes JSONB,  // 패치 내용 상세
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ⚠️ 제한사항 및 고려사항

### 1. iRating 증감 추적
- iRacing API는 세션 전후 iRating 변화를 직접 제공하지 않음
- 대안:
  - 세션 결과의 `i_rating` 필드와 다음 세션의 iRating 비교
  - 드라이버별 시간별 iRating 추적 (많은 API 호출 필요)

### 2. API Rate Limit
- iRacing Data API는 요청 제한이 있을 수 있음
- 배치 수집 작업은 백그라운드에서 실행
- 캐싱 전략 필요

### 3. 데이터 수집 주기
- 실시간 수집은 불가능 (iRacing API 제한)
- 주기적 배치 수집 (예: 매일, 매주)
- 최신 데이터 반영에 지연 발생 가능

### 4. 랩타임 데이터
- `best_lap_time`은 세션 결과에 포함됨
- 하지만 모든 랩타임 데이터는 제공되지 않음 (최고 랩타임만)

---

## 🚀 구현 우선순위

1. **Phase 1**: 기본 메타 리포트 (승률, 픽률, Top 5)
   - 세션 결과 수집
   - 통계 계산
   - UI 표시

2. **Phase 2**: iRating 대비 랩타임 분석
   - iRating 구간별 평균 랩타임 계산
   - 차량 비교 시각화

3. **Phase 3**: BoP 패치 추적
   - 패치 날짜 기록
   - 전후 비교
   - 알림 시스템

4. **Phase 4**: iRating 증감 추적 (제한적)
   - 드라이버별 시간별 iRating 추적
   - 차량별 평균 증감 계산

---

## ✅ 구현 완료

### 1. 타입 정의
- `ghostx_front/lib/iracingTypes.ts`에 메타 차량 분석 관련 타입 추가:
  - `IracingParticipant`
  - `IracingSubsessionResult`
  - `MetaVehicleStats`
  - `BopAlert`

### 2. API 엔드포인트

#### 데이터 수집 API
- **POST** `/api/iracing/meta/collect`
  - 특정 subsession 결과를 수집하여 DB에 저장
  - Query params: `subsession_id` (필수)

#### 메타 리포트 조회 API
- **GET** `/api/iracing/meta/report`
  - 시리즈/트랙별 메타 리포트 조회
  - Query params:
    - `series_id` (필수)
    - `track_id` (선택)
    - `period_days` (기본값 7)

#### BoP 패치 알림 API
- **GET** `/api/iracing/meta/bop-alerts`
  - BoP 패치에 따른 급상승/하락 차량 알림
  - Query params:
    - `series_id` (선택)
    - `patch_date` (선택)
    - `threshold` (기본값 20%)

### 3. 데이터베이스 스키마
- `DATABASE_MIGRATION_IRACING_META.sql` 파일 생성
  - `iracing_subsession_results` - 세션 결과 원본 데이터
  - `iracing_participant_results` - 참여자 결과
  - `iracing_meta_vehicle_stats` - 집계된 통계
  - `iracing_bop_patches` - BoP 패치 이력

---

## 📝 사용 방법

### 1. 데이터베이스 마이그레이션 실행

```sql
-- Supabase SQL Editor에서 실행
-- DATABASE_MIGRATION_IRACING_META.sql 파일의 내용을 실행
```

### 2. 데이터 수집

```bash
# 특정 subsession 수집
POST /api/iracing/meta/collect?subsession_id=12345678

# 응답 예시:
{
  "message": "Collection completed",
  "collected": 1
}
```

### 3. 메타 리포트 조회

```bash
# 시리즈별 메타 리포트 조회 (최근 7일)
GET /api/iracing/meta/report?series_id=123

# 트랙별 메타 리포트 조회 (최근 14일)
GET /api/iracing/meta/report?series_id=123&track_id=456&period_days=14

# 응답 예시:
[
  {
    "car_id": 123,
    "car_name": "Ferrari 488 GT3",
    "series_id": 123,
    "series_name": "GT3 Challenge",
    "track_id": 456,
    "track_name": "Watkins Glen",
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-08T00:00:00Z",
    "total_races": 50,
    "total_participants": 500,
    "wins": 15,
    "win_rate": 30.0,
    "top5_finishes": 35,
    "top5_rate": 70.0,
    "pick_rate": 25.5,
    "avg_lap_time": 125.234,
    "avg_irating_gain": null,
    "irating_bins": {
      "2000-2100": {
        "avg_lap_time": 125.5,
        "count": 50
      }
    }
  }
]
```

### 4. BoP 패치 알림 조회

```bash
# 최근 패치의 급상승 차량 조회
GET /api/iracing/meta/bop-alerts?series_id=123&threshold=20

# 응답 예시:
[
  {
    "car_id": 123,
    "car_name": "Ferrari 488 GT3",
    "series_id": 123,
    "series_name": "GT3 Challenge",
    "patch_date": "2024-01-15T00:00:00Z",
    "win_rate_change": 25.5,
    "pick_rate_change": 30.2,
    "top5_rate_change": 28.0,
    "alert_type": "surge"
  }
]
```

---

## 🔄 다음 단계

1. ✅ iRacing Data API의 `/data/results/get` 엔드포인트 테스트
2. ✅ 데이터 수집 API 구현
3. ✅ 메타 리포트 계산 로직 구현
4. ⏳ 데이터베이스 마이그레이션 실행
5. ⏳ UI 컴포넌트 개발
6. ⏳ 데이터 수집 스케줄러 구현 (백그라운드 작업)
