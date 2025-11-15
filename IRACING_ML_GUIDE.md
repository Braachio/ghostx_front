# iRacing ML 기반 세션 분석 및 예측 시스템

## 개요

이 시스템은 iRacing 세션의 참가자 데이터를 분석하여:
1. 각 참가자의 상세 통계 계산 (평균 Inc, 완주율, 최근 순위, IR/SR 변화율, 우승률 등)
2. 규칙 기반 전략 추천 (향후 ML 모델로 대체 가능)
3. 순위 예측 (향후 ML 모델로 대체 가능)

## 현재 구현 상태

### ✅ 완료된 기능

1. **데이터베이스 스키마**
   - `iracing_session_participant_stats`: 참가자별 상세 통계 저장
   - `iracing_session_predictions`: 세션 전체 예측 결과 저장
   - `iracing_ml_training_data`: ML 모델 학습용 데이터 저장
   - `iracing_ml_models`: ML 모델 메타데이터 저장

2. **특성 추출 로직** (`lib/iracingMLFeatures.ts`)
   - 최근 레이스 데이터로부터 통계 특성 추출
   - 평균 인시던트, DNF율, 평균 완주 순위, 우승률, Top5/Top10율
   - IR/SR 변화 추세 계산

3. **고도화된 세션 요약 API** (`/api/iracing/session/[sessionId]/advanced`)
   - 각 참가자의 상세 통계 계산
   - 규칙 기반 순위 예측 ✅ (iRating, 최근 성적, 인시던트율 기반)
   - 전략 추천 ✅ (규칙 기반: aggressive/balanced/defensive/survival)

4. **프론트엔드 UI 업데이트** ✅
   - 고도화된 전략 제안 표시 ✅
   - 예측 순위 표시 ✅ (참가자 목록에 "예측: X등" 표시)
   - 상세 통계 시각화 ✅ (IR, SR, 평균 Inc 표시)

### 🚧 향후 구현 필요

1. **ML 모델 학습 파이프라인** (예상 소요: 2-3주)
   - Python 기반 학습 스크립트 작성
   - 과거 세션 데이터 수집 및 전처리
   - 모델 학습 및 평가 (RandomForest, GradientBoosting 등)
   - 모델 배포 (Supabase Edge Function 또는 별도 API 서버)

2. **실시간 예측 API** (예상 소요: 1주)
   - 학습된 ML 모델 로드
   - 실시간 예측 수행
   - 결과 저장 및 캐싱
   - 규칙 기반 예측과 ML 예측 비교/검증

**ML 구현 일정:**
- **1주차**: 과거 세션 데이터 수집 스크립트 작성 및 데이터 수집 시작
- **2주차**: 데이터 전처리 및 특성 엔지니어링, 모델 학습 스크립트 작성
- **3주차**: 모델 학습 및 평가, 하이퍼파라미터 튜닝
- **4주차**: 모델 배포 및 API 통합, A/B 테스트 준비

## ML 모델 학습 가이드

### 1. 데이터 수집

과거 세션 결과를 수집하여 학습 데이터를 구축합니다:

```sql
-- 학습 데이터 조회 예시
SELECT 
  i_rating,
  safety_rating,
  avg_incidents_per_race,
  dnf_rate,
  recent_avg_finish_position,
  win_rate,
  ir_trend,
  sr_trend,
  sof,
  starting_position,
  total_participants,
  actual_finish_position,
  actual_incidents,
  actual_dnf
FROM iracing_ml_training_data
WHERE session_start_time >= NOW() - INTERVAL '90 days'
ORDER BY session_start_time DESC;
```

### 2. 모델 학습 (Python 예시)

```python
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# 데이터 로드
df = pd.read_sql("SELECT * FROM iracing_ml_training_data", connection)

# 특성 선택
features = [
    'i_rating', 'safety_rating', 'avg_incidents_per_race', 'dnf_rate',
    'recent_avg_finish_position', 'win_rate', 'ir_trend', 'sr_trend',
    'sof', 'starting_position', 'total_participants'
]

X = df[features].fillna(0)
y = df['actual_finish_position']

# 학습/테스트 분할
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 모델 학습
model = GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42)
model.fit(X_train, y_train)

# 평가
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"MAE: {mae:.2f}, R2: {r2:.4f}")

# 모델 저장
joblib.dump(model, 'finish_position_model_v1.pkl')
```

### 3. 모델 배포

학습된 모델을 Supabase Edge Function 또는 별도 API 서버에 배포:

```typescript
// Edge Function 예시
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as tf from "https://esm.sh/@tensorflow/tfjs-node"

serve(async (req) => {
  const { features } = await req.json()
  
  // 모델 로드 (S3 또는 로컬 파일)
  const model = await tf.loadLayersModel('https://your-bucket.s3.amazonaws.com/model.json')
  
  // 예측 수행
  const prediction = model.predict(tf.tensor2d([features]))
  const predictedPosition = prediction.dataSync()[0]
  
  return new Response(JSON.stringify({ predictedPosition }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

### 4. 모델 통합

고도화된 세션 요약 API에서 ML 모델을 호출:

```typescript
// app/api/iracing/session/[sessionId]/advanced/route.ts 수정
async function predictWithML(features: ParticipantFeatures): Promise<number> {
  const mlInput = featuresToMLInput(features)
  
  // Edge Function 또는 ML API 호출
  const response = await fetch('https://your-project.supabase.co/functions/v1/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ features: mlInput }),
  })
  
  const { predictedPosition } = await response.json()
  return predictedPosition
}
```

## 전략 추천 로직

현재는 규칙 기반 전략 추천을 사용하지만, 향후 ML 분류 모델로 대체 가능:

```python
from sklearn.ensemble import RandomForestClassifier

# 전략 분류 모델 학습
strategy_labels = ['aggressive', 'balanced', 'defensive', 'survival']
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_strategy_train)

# 예측
predicted_strategy = model.predict([features])
strategy_confidence = model.predict_proba([features]).max()
```

## 성능 최적화

1. **캐싱**: 세션 요약 결과를 캐시하여 API 호출 최소화
2. **병렬 처리**: 참가자 데이터 수집을 병렬로 수행
3. **점진적 로딩**: 기본 정보 먼저 표시, 상세 통계는 백그라운드에서 로드

## 향후 개선 사항

1. **실시간 업데이트**: 세션 진행 중 실시간으로 예측 업데이트
2. **앙상블 모델**: 여러 모델의 예측을 결합하여 정확도 향상
3. **딥러닝 모델**: LSTM 등 시계열 모델로 추세 예측
4. **A/B 테스트**: 다양한 모델 버전을 테스트하여 최적 모델 선택

