# iRacing ML 모델 학습 가이드

## 개요

이 문서는 수집된 학습 데이터를 사용하여 순위 예측 ML 모델을 학습하는 방법을 설명합니다.

## 데이터 상태

- **총 레코드 수**: 31,025개
- **데이터 품질**: 핵심 필드는 100% 수집됨
- **타겟 변수**: `actual_finish_position` (실제 완주 순위)

## ML 모델 학습용 필드 목록

### ✅ 사용 가능한 필드 (높은 비율)

#### 1. 핵심 특성 (100% 수집)

| 필드명 | 타입 | 설명 | 범위/예시 |
|--------|------|------|-----------|
| `i_rating` | INTEGER | 내 iRating | 0 ~ 10,000+ |
| `safety_rating` | NUMERIC | 내 Safety Rating | 0.0 ~ 4.99 |
| `starting_position` | INTEGER | 시작 순위 | 1 ~ total_participants |

#### 2. 상대 전력 통계 (100% 수집) - **핵심!**

| 필드명 | 타입 | 설명 | 계산 방법 |
|--------|------|------|-----------|
| `avg_opponent_ir` | INTEGER | 상대들의 평균 iRating (나를 제외) | 상대 iRating 평균 |
| `max_opponent_ir` | INTEGER | 상대들의 최고 iRating | 상대 iRating 최대값 |
| `min_opponent_ir` | INTEGER | 상대들의 최저 iRating | 상대 iRating 최소값 |
| `ir_diff_from_avg` | INTEGER | 내 iRating - 평균 상대 iRating | 양수=내가 높음, 음수=내가 낮음 |
| `sof` | INTEGER | Strength of Field (전체 평균 iRating) | 세션 전체 평균 iRating |

#### 3. 세션 컨텍스트 (100% 수집)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `total_participants` | INTEGER | 총 참가자 수 |
| `series_id` | INTEGER | 시리즈 ID |
| `track_id` | INTEGER | 트랙 ID |
| `car_id` | INTEGER | 차량 ID |

#### 4. 주행 특성

| 필드명 | 타입 | 수집률 | 설명 |
|--------|------|--------|------|
| `best_lap_time` | NUMERIC | 99.75% | 최고 랩타임 (초) |
| `average_lap_time` | NUMERIC | 38.31% | 평균 랩타임 (초) - null 처리 필요 |
| `laps_complete` | INTEGER | 99.75% | 완주 랩 수 |

#### 5. 타겟 변수 (100% 수집)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `actual_finish_position` | INTEGER | 실제 완주 순위 (1 ~ total_participants) |
| `actual_incidents` | INTEGER | 실제 인시던트 수 |
| `actual_dnf` | BOOLEAN | 실제 DNF 여부 |

### ❌ 사용 불가능한 필드 (0% 수집)

다음 필드들은 수집되지 않았으므로 ML 모델 학습에 사용할 수 없습니다:

- `avg_incidents_per_race` (최근 레이스 데이터 없음)
- `dnf_rate` (최근 레이스 데이터 없음)
- `recent_avg_finish_position` (최근 레이스 데이터 없음)
- `win_rate`, `top5_rate`, `top10_rate` (최근 레이스 데이터 없음)
- `ir_trend`, `sr_trend` (최근 레이스 데이터 없음)
- `fastest_lap_time`, `fastest_qualifying_lap_time` (API에서 제공하지 않음)
- `qualifying_time`, `laps_led`, `points` (API에서 제공하지 않음)

## 데이터 전처리

### 1. 필수 필드 확인

```python
import pandas as pd
from supabase import create_client

# Supabase 연결
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 데이터 로드
data = supabase.table('iracing_ml_training_data').select('*').execute()
df = pd.DataFrame(data.data)

# 필수 필드 확인
required_fields = [
    'i_rating', 'safety_rating', 'starting_position',
    'avg_opponent_ir', 'max_opponent_ir', 'min_opponent_ir', 
    'ir_diff_from_avg', 'sof', 'total_participants',
    'best_lap_time', 'laps_complete',
    'actual_finish_position'
]

# 필수 필드가 모두 있는 레코드만 선택
df_clean = df.dropna(subset=required_fields)
print(f"전체: {len(df)}개, 정제 후: {len(df_clean)}개")
```

### 2. 선택적 필드 처리

```python
# average_lap_time는 일부만 있으므로, null인 경우 best_lap_time으로 대체
df_clean['average_lap_time'] = df_clean['average_lap_time'].fillna(df_clean['best_lap_time'])

# 또는 null인 경우 제외
df_clean = df_clean.dropna(subset=['average_lap_time'])
```

### 3. 특성 엔지니어링

```python
# 상대 전력 관련 파생 변수 생성
df_clean['ir_advantage'] = df_clean['ir_diff_from_avg'] / 100  # 정규화
df_clean['ir_range'] = df_clean['max_opponent_ir'] - df_clean['min_opponent_ir']  # 상대 전력 분산
df_clean['ir_rank_pct'] = (df_clean['i_rating'] - df_clean['min_opponent_ir']) / (df_clean['max_opponent_ir'] - df_clean['min_opponent_ir'] + 1)  # 상대 순위 비율

# 주행 특성 파생 변수
df_clean['laps_completion_rate'] = df_clean['laps_complete'] / df_clean['total_participants']  # 완주율 (대략적)
df_clean['lap_time_diff'] = df_clean['average_lap_time'] - df_clean['best_lap_time']  # 평균-최고 랩타임 차이

# 세션 컨텍스트
df_clean['starting_rank_pct'] = df_clean['starting_position'] / df_clean['total_participants']  # 시작 순위 비율
```

## ML 모델 학습

### 1. 특성 선택

```python
# 입력 특성 (Features)
features = [
    # 핵심 특성
    'i_rating',
    'safety_rating',
    'starting_position',
    
    # 상대 전력 통계 (핵심!)
    'avg_opponent_ir',
    'max_opponent_ir',
    'min_opponent_ir',
    'ir_diff_from_avg',
    'sof',
    
    # 파생 변수
    'ir_advantage',
    'ir_range',
    'ir_rank_pct',
    'starting_rank_pct',
    
    # 주행 특성
    'best_lap_time',
    'average_lap_time',
    'laps_complete',
    'lap_time_diff',
    
    # 세션 컨텍스트
    'total_participants',
    # 'series_id',  # 카테고리 변수는 원-핫 인코딩 필요
    # 'track_id',   # 카테고리 변수는 원-핫 인코딩 필요
    # 'car_id',     # 카테고리 변수는 원-핫 인코딩 필요
]

# 타겟 변수 (Target)
target = 'actual_finish_position'
```

### 2. 모델 학습 예시 (Random Forest)

```python
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# 데이터 준비
X = df_clean[features].values
y = df_clean[target].values

# 학습/테스트 분할
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 모델 학습
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=20,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# 예측
y_pred = model.predict(X_test)

# 평가
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R²: {r2:.4f}")
```

### 3. 모델 학습 예시 (Gradient Boosting)

```python
from sklearn.ensemble import GradientBoostingRegressor

model = GradientBoostingRegressor(
    n_estimators=200,
    learning_rate=0.1,
    max_depth=10,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# 평가
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"MAE: {mae:.2f}")
print(f"RMSE: {rmse:.2f}")
print(f"R²: {r2:.4f}")
```

### 4. 특성 중요도 분석

```python
import matplotlib.pyplot as plt

# 특성 중요도
feature_importance = pd.DataFrame({
    'feature': features,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(feature_importance)

# 시각화
plt.figure(figsize=(10, 8))
plt.barh(feature_importance['feature'], feature_importance['importance'])
plt.xlabel('Importance')
plt.title('Feature Importance')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()
```

## 예상 성능

### 목표 지표

- **MAE (Mean Absolute Error)**: 3~5 순위 차이
- **RMSE (Root Mean Squared Error)**: 4~6 순위 차이
- **R² Score**: 0.6~0.8 (상대 전력 통계가 핵심이므로 높은 성능 기대)

### 성능 개선 전략

1. **더 많은 데이터 수집**: 현재 31,025개 → 목표 50,000개 이상
2. **특성 엔지니어링**: 상대 전력 관련 파생 변수 추가
3. **앙상블 모델**: Random Forest + Gradient Boosting 조합
4. **하이퍼파라미터 튜닝**: GridSearchCV 또는 Optuna 사용

## 모델 배포

### 1. 모델 저장

```python
import joblib

# 모델 저장
joblib.dump(model, 'iracing_rank_predictor.pkl')

# 특성 목록 저장
import json
with open('model_features.json', 'w') as f:
    json.dump(features, f)
```

### 2. API 통합

```python
# app/api/iracing/ml/predict/route.ts에서 사용
import joblib
import json

model = joblib.load('iracing_rank_predictor.pkl')
with open('model_features.json', 'r') as f:
    features = json.load(f)

def predict_rank(participant_features):
    # 특성 추출
    X = [[
        participant_features['i_rating'],
        participant_features['safety_rating'],
        participant_features['starting_position'],
        participant_features['avg_opponent_ir'],
        # ... 나머지 특성
    ]]
    
    # 예측
    predicted_rank = model.predict(X)[0]
    return round(predicted_rank)
```

## 다음 단계

1. ✅ 데이터 수집 완료 (31,025개 레코드)
2. ✅ 데이터 정제 완료 (필드 분석)
3. ⏳ 모델 학습 스크립트 작성
4. ⏳ 모델 학습 및 평가
5. ⏳ 하이퍼파라미터 튜닝
6. ⏳ 모델 배포 및 API 통합
7. ⏳ A/B 테스트 (규칙 기반 vs ML 모델)

## 참고 자료

- 데이터 정제 분석: `DATA_CLEANUP_ANALYSIS.md`
- 데이터 수집 가이드: `ML_TRAINING_DATA_COLLECTION.md`
- 특성 추출 유틸리티: `lib/iracingMLFeatures.ts`


