# 레이스 시작 전 순위 예측용 ML 모델 특성

## 개요

레이스 시작 전에 순위를 예측하기 위해서는 **레이스 시작 전에 알 수 있는 정보만** 사용해야 합니다.

## ✅ 레이스 시작 전에 알 수 있는 필드

### 1. 핵심 특성
- `i_rating`: 내 iRating (레이스 시작 전 알 수 있음)
- `safety_rating`: 내 Safety Rating (레이스 시작 전 알 수 있음)

### 2. 상대 전력 통계 (핵심!)
- `avg_opponent_ir`: 상대들의 평균 iRating (로비 참가자 정보로 알 수 있음)
- `max_opponent_ir`: 상대들의 최고 iRating
- `min_opponent_ir`: 상대들의 최저 iRating
- `ir_diff_from_avg`: 내 iRating - 평균 상대 iRating
- `sof`: Strength of Field (로비 평균 iRating)

### 3. 세션 컨텍스트
- `total_participants`: 총 참가자 수 (로비 정보로 알 수 있음)
- `series_id`: 시리즈 ID
- `track_id`: 트랙 ID
- `car_id`: 차량 ID

### 4. 과거 주행 특성 (선택적)
- `best_lap_time`: 과거 최고 랩타임 (드라이버의 일반적인 페이스)
- `average_lap_time`: 과거 평균 랩타임 (드라이버의 일반적인 페이스)
- ⚠️ **주의**: 이 필드들은 과거 레이스 데이터이므로, 레이스 시작 전에 드라이버의 일반적인 페이스를 알 수 있다는 가정 하에 사용

## ❌ 레이스 시작 전에 알 수 없는 필드

다음 필드들은 **레이스 종료 후에만 알 수 있는 정보**이므로 ML 모델 학습에 사용하면 안 됩니다:

### 1. 레이스 진행 정보
- `starting_position`: 시작 순위 (퀄리파잉 결과, 레이스 시작 전에는 알 수 없음)
- `laps_complete`: 완주 랩 수 (레이스 종료 후에만 알 수 있음)

### 2. 레이스 결과
- `actual_finish_position`: 실제 완주 순위 (타겟 변수이므로 제외)
- `actual_incidents`: 실제 인시던트 수 (타겟 변수이므로 제외)
- `actual_dnf`: 실제 DNF 여부 (타겟 변수이므로 제외)

## ML 모델 학습용 최종 특성 목록

```python
features = [
    # 핵심 특성
    'i_rating',
    'safety_rating',
    
    # 상대 전력 통계 (핵심!)
    'avg_opponent_ir',
    'max_opponent_ir',
    'min_opponent_ir',
    'ir_diff_from_avg',
    'sof',
    
    # 파생 변수
    'ir_advantage',      # ir_diff_from_avg / 100
    'ir_range',          # max_opponent_ir - min_opponent_ir
    'ir_rank_pct',       # (i_rating - min_opponent_ir) / (max_opponent_ir - min_opponent_ir)
    
    # 주행 특성 (과거 데이터)
    'best_lap_time',
    'average_lap_time',
    'lap_time_diff',     # average_lap_time - best_lap_time
    
    # 세션 컨텍스트
    'total_participants',
    # 'series_id',  # 카테고리 변수 (원-핫 인코딩 필요)
    # 'track_id',   # 카테고리 변수 (원-핫 인코딩 필요)
    # 'car_id',     # 카테고리 변수 (원-핫 인코딩 필요)
]
```

## 특성 엔지니어링

### 파생 변수 생성

```python
# 상대 전력 관련
df['ir_advantage'] = df['ir_diff_from_avg'] / 100
df['ir_range'] = df['max_opponent_ir'] - df['min_opponent_ir']
df['ir_rank_pct'] = (
    (df['i_rating'] - df['min_opponent_ir']) / 
    (df['max_opponent_ir'] - df['min_opponent_ir'] + 1)
)

# 주행 특성
df['lap_time_diff'] = df['average_lap_time'] - df['best_lap_time']
```

## 예측 시나리오

### 레이스 시작 전 예측

1. **로비 참가자 정보 수집**
   - 각 참가자의 iRating, Safety Rating
   - 상대 전력 통계 계산 (avg_opponent_ir, max_opponent_ir, min_opponent_ir)
   - SOF 계산

2. **드라이버 과거 데이터 조회** (선택적)
   - best_lap_time, average_lap_time (해당 트랙/차량 기준)

3. **ML 모델 예측**
   - 레이스 시작 전에 알 수 있는 특성만 사용
   - 예측 순위 출력

### 주의사항

- `starting_position`은 퀄리파잉 결과이므로 레이스 시작 전에는 알 수 없습니다.
- 만약 퀄리파잉이 끝난 후 예측한다면, `starting_position`을 특성에 추가할 수 있습니다.
- 하지만 일반적으로는 레이스 시작 전(퀄리파잉 전)에 예측하는 것이 더 유용합니다.

## 데이터 수집 시 고려사항

현재 수집 중인 데이터는 레이스 종료 후 데이터이므로:
- `starting_position`: 실제 시작 순위 (퀄리파잉 결과)
- `laps_complete`: 실제 완주 랩 수

이 필드들은 학습 데이터로는 사용할 수 있지만, **실제 예측 시에는 사용할 수 없습니다**.

## 향후 개선 방안

1. **퀄리파잉 결과 통합**: 퀄리파잉이 끝난 후 예측 시 `starting_position` 추가
2. **트랙/차량별 과거 데이터**: 해당 트랙/차량에서의 과거 best_lap_time 사용
3. **실시간 예측**: 레이스 중간에도 예측 가능하도록 (이 경우 `laps_complete` 등 사용 가능)


