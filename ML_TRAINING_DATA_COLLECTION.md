# ML 학습 데이터 수집 가이드

## 개요

과거 세션 데이터를 일괄 수집하여 ML 모델 학습용 데이터를 생성합니다.

**핵심 개념**: 각 세션의 모든 참가자를 기준으로 학습 데이터를 생성합니다.
- 27명 세션 → 27개의 학습 샘플 생성
- 각 샘플: (내 특성 + 상대 전력 통계) → 실제 완주 순위

## 데이터베이스 마이그레이션

먼저 상대 전력 통계 필드를 추가해야 합니다:

```sql
-- Supabase SQL Editor에서 실행
\i DATABASE_MIGRATION_IRACING_ML_OPPONENT_STATS.sql
```

또는 직접 실행:

```sql
ALTER TABLE iracing_ml_training_data
ADD COLUMN IF NOT EXISTS avg_opponent_ir INTEGER,
ADD COLUMN IF NOT EXISTS max_opponent_ir INTEGER,
ADD COLUMN IF NOT EXISTS min_opponent_ir INTEGER,
ADD COLUMN IF NOT EXISTS ir_diff_from_avg INTEGER;
```

## API 사용법

### 엔드포인트

```
POST /api/iracing/ml/collect-training-data
```

### 요청 예시

```typescript
// 세션 ID 배열 전송
const response = await fetch('/api/iracing/ml/collect-training-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    subsessionIds: [
      71628994,
      71693839,
      71654541,
      // ... 더 많은 세션 ID
    ]
  })
})

const result = await response.json()
console.log(result)
// {
//   success: true,
//   totalSessions: 3,
//   totalCollected: 81,  // 27명 × 3세션
//   totalFailed: 0,
// }
```

### 응답 형식

```typescript
{
  success: boolean
  totalSessions: number        // 처리한 세션 수
  totalCollected: number       // 생성된 학습 데이터 수
  totalFailed: number          // 실패한 세션 수
  errors?: string[]            // 에러 메시지 (있는 경우)
}
```

## 수집되는 데이터 구조

각 참가자마다 다음 정보가 수집됩니다:

### 입력 특성 (Features)

1. **개인 특성**
   - `i_rating`: 내 iRating
   - `safety_rating`: 내 Safety Rating
   - `avg_incidents_per_race`: 최근 평균 인시던트
   - `dnf_rate`: 최근 DNF율
   - `recent_avg_finish_position`: 최근 평균 완주 순위
   - `win_rate`: 최근 우승률
   - `ir_trend`: 최근 iRating 추세
   - `sr_trend`: 최근 Safety Rating 추세
   - `starting_position`: 시작 순위

2. **상대 전력 통계** (핵심!)
   - `avg_opponent_ir`: 상대들의 평균 iRating (나를 제외)
   - `max_opponent_ir`: 상대들의 최고 iRating
   - `min_opponent_ir`: 상대들의 최저 iRating
   - `ir_diff_from_avg`: 내 iRating - 평균 상대 iRating
   - `sof`: Strength of Field (전체 평균 iRating)

3. **세션 컨텍스트**
   - `series_id`: 시리즈 ID
   - `track_id`: 트랙 ID
   - `total_participants`: 총 참가자 수

### 실제 결과 (Labels)

- `actual_finish_position`: 실제 완주 순위
- `actual_incidents`: 실제 인시던트 수
- `actual_dnf`: 실제 DNF 여부

## 학습 데이터 예시

### 시나리오 1: 강한 로비

```json
{
  "i_rating": 2000,
  "avg_opponent_ir": 2200,  // 상대들이 평균적으로 더 높음
  "ir_diff_from_avg": -200, // 내가 평균보다 200 낮음
  "actual_finish_position": 15  // 실제로 15등
}
```

### 시나리오 2: 약한 로비

```json
{
  "i_rating": 2000,
  "avg_opponent_ir": 1800,  // 상대들이 평균적으로 더 낮음
  "ir_diff_from_avg": +200, // 내가 평균보다 200 높음
  "actual_finish_position": 5  // 실제로 5등
}
```

## 데이터 수집 전략

### 1. 과거 세션 ID 수집

iRacing에서 과거 세션 ID를 수집하는 방법:

1. **자동 수집 (권장)**: `/api/iracing/ml/get-recent-session-ids?cust_id=YOUR_CUST_ID`
   - 최근 레이스에서 세션 ID 자동 추출
   - 중복 제거 및 정렬
   
2. **수동 수집**: 자신이 참가했던 세션 ID 기록
3. **메타 리포트**: 특정 시리즈/트랙의 과거 세션 조회

### 빠른 시작 (자동 수집)

```typescript
// 1. 최근 세션 ID 가져오기
const sessionIdsRes = await fetch('/api/iracing/ml/get-recent-session-ids?cust_id=1060971&limit=100')
const { sessionIds } = await sessionIdsRes.json()

// 2. 학습 데이터 수집
const collectRes = await fetch('/api/iracing/ml/collect-training-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ subsessionIds: sessionIds })
})

const result = await collectRes.json()
console.log(`수집 완료: ${result.totalCollected}개 레코드`)
```

### 2. 배치 수집 스크립트 예시

```typescript
// scripts/collect-training-data.ts
async function collectBatch(sessionIds: number[]) {
  const BATCH_SIZE = 10 // 한 번에 10개씩 처리
  
  for (let i = 0; i < sessionIds.length; i += BATCH_SIZE) {
    const batch = sessionIds.slice(i, i + BATCH_SIZE)
    
    const res = await fetch('/api/iracing/ml/collect-training-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subsessionIds: batch })
    })
    
    const result = await res.json()
    console.log(`Batch ${i / BATCH_SIZE + 1}: ${result.totalCollected} records`)
    
    // Rate limit 방지
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

// 사용 예시
const sessionIds = [
  // ... 세션 ID 목록
]
await collectBatch(sessionIds)
```

## 필요한 데이터량

- **최소**: 500개 세션 (약 10,000-15,000개 레코드)
- **권장**: 2,000개 세션 (약 40,000-60,000개 레코드)
- **이상적**: 5,000개 이상 세션 (100,000개 이상 레코드)

## 주의사항

1. **Rate Limit**: iRacing API rate limit을 고려하여 세션 간 딜레이 필요
2. **중복 방지**: 이미 수집된 세션은 자동으로 스킵됨
3. **에러 처리**: 일부 세션이 실패해도 계속 진행됨
4. **데이터 품질**: 최근 레이스 데이터가 없는 참가자는 특성 추출이 제한적

## 빠른 테스트 (브라우저 콘솔)

브라우저 개발자 도구 콘솔에서 바로 실행:

```javascript
// 1. 최근 세션 ID 가져오기
const custId = '814119' // 테스트용 cust_id
const sessionIdsRes = await fetch(`/api/iracing/ml/get-recent-session-ids?cust_id=${custId}&limit=50`)
const sessionIdsData = await sessionIdsRes.json()
console.log('세션 ID 응답:', sessionIdsData)
console.log(`가져온 세션 ID: ${sessionIdsData.sessionIds?.length || 0}개`, sessionIdsData.sessionIds?.slice(0, 5))

// 2. 학습 데이터 수집 (테스트: 처음 3개만)
const testSessionIds = sessionIdsData.sessionIds?.slice(0, 3) || []
if (testSessionIds.length === 0) {
  console.error('세션 ID가 없습니다!')
} else {
  console.log('수집할 세션 ID:', testSessionIds)
  
  const collectRes = await fetch('/api/iracing/ml/collect-training-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subsessionIds: testSessionIds })
  })
  
  const result = await collectRes.json()
  console.log('수집 결과:', result)
  // {
  //   success: true,
  //   totalSessions: 3,
  //   totalCollected: ~81개 (27명 × 3세션),
  //   totalFailed: 0
  // }
}
```

## 전체 데이터 수집 (모든 한국 유저)

**약 400명의 한국 유저 cust_id**에 대해 모든 학습 데이터를 수집합니다.

### 브라우저 콘솔에서 실행

```javascript
// scripts/collect-all-training-data.js 파일을 먼저 로드하거나 아래 코드를 복사

// 1. 스크립트 파일 로드 (권장)
// 개발자 도구 > Sources > scripts/collect-all-training-data.js 열기
// 또는 아래 전체 코드를 콘솔에 붙여넣기

// 2. 실행
collectAllTrainingData()  // 기본값: 모든 한국 유저 (약 400명)

// 또는 옵션 지정
collectAllTrainingData(
  KOREAN_USER_IDS,  // cust_id 배열 (기본값)
  5,                // 배치 크기 (기본값: 5)
  50                // 유저당 세션 제한 (기본값: 50)
)
```

### 작동 방식

1. **1단계: 세션 ID 수집**
   - 모든 cust_id에 대해 최근 세션 ID를 수집
   - 중복 제거 (여러 유저가 같은 세션에 참가한 경우)
   - 유저 간 0.5초 딜레이 (Rate limit 방지)

2. **2단계: 데이터 수집**
   - 고유한 세션 ID를 배치로 나눠서 수집
   - 배치 간 2초 딜레이 (Rate limit 방지)
   - 각 세션의 모든 참가자 데이터 수집

### 예상 소요 시간

- **약 400명의 유저** × **유저당 0.5초** = 약 3-4분 (1단계)
- **고유 세션 수**에 따라 다름 (예: 1000개 세션 = 약 7분, 2단계)
- **총 예상 시간: 10-15분** (세션 수에 따라 다름)

### 진행 상황 확인

콘솔에서 실시간으로 진행 상황을 확인할 수 있습니다:
- 각 유저의 세션 ID 수집 현황
- 배치별 수집 진행률
- 최종 통계 (총 레코드 수, 실패 건수 등)

## 다음 단계

1. ✅ 데이터 수집 API 생성
2. ✅ 상대 전력 통계 필드 추가
3. ✅ 최근 세션 ID 자동 수집 API 추가
4. ✅ 추가 Feature 필드 추가 (top5_rate, best_lap_time, car_id 등)
5. ⏳ 과거 세션 ID 수집 및 배치 실행
6. ⏳ 충분한 데이터 확보 후 ML 모델 학습

## ML 모델 학습 시 활용

학습 시 다음 특성을 사용:

```python
features = [
    # 개인 특성
    'i_rating',
    'safety_rating',
    'avg_incidents_per_race',
    'dnf_rate',
    'recent_avg_finish_position',
    'win_rate',
    'ir_trend',
    'sr_trend',
    'starting_position',
    
    # 상대 전력 통계 (핵심!)
    'avg_opponent_ir',
    'max_opponent_ir',
    'min_opponent_ir',
    'ir_diff_from_avg',
    'sof',
    
    # 세션 컨텍스트
    'total_participants',
]

target = 'actual_finish_position'
```

이렇게 하면 **"상대 전력 기반 순위 예측"**이 가능합니다!

