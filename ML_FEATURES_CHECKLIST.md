# ML 학습 데이터 Feature 체크리스트

## 현재 수집 중인 Feature ✅

### 1. 개인 특성 (Personal Features)
- ✅ `i_rating`: 현재 iRating
- ✅ `safety_rating`: 현재 Safety Rating
- ✅ `avg_incidents_per_race`: 최근 평균 인시던트 (최근 5경기)
- ✅ `dnf_rate`: 최근 DNF율 (최근 5경기)
- ✅ `recent_avg_finish_position`: 최근 평균 완주 순위 (최근 5경기)
- ✅ `win_rate`: 최근 우승률 (최근 5경기)
- ✅ `ir_trend`: 최근 iRating 추세
- ✅ `sr_trend`: 최근 Safety Rating 추세
- ✅ `starting_position`: 시작 순위

### 2. 상대 전력 통계 (Opponent Strength) ⭐ 핵심!
- ✅ `avg_opponent_ir`: 상대들의 평균 iRating (나를 제외)
- ✅ `max_opponent_ir`: 상대들의 최고 iRating
- ✅ `min_opponent_ir`: 상대들의 최저 iRating
- ✅ `ir_diff_from_avg`: 내 iRating - 평균 상대 iRating
- ✅ `sof`: Strength of Field (전체 평균 iRating)

### 3. 세션 컨텍스트 (Session Context)
- ✅ `series_id`: 시리즈 ID
- ✅ `track_id`: 트랙 ID
- ✅ `total_participants`: 총 참가자 수

### 4. 실제 결과 (Labels)
- ✅ `actual_finish_position`: 실제 완주 순위
- ✅ `actual_incidents`: 실제 인시던트 수
- ✅ `actual_dnf`: 실제 DNF 여부

## 추가로 수집 가능한 Feature (현재 미수집) ⚠️

### 1. 계산은 하지만 저장 안 함
- ⚠️ `top5_rate`: 최근 Top5율 (이미 `extractFeaturesFromRecentRaces`에서 계산)
- ⚠️ `top10_rate`: 최근 Top10율 (이미 `extractFeaturesFromRecentRaces`에서 계산)
- ⚠️ `avg_finish_position`: 전체 평균 완주 순위 (최근 5경기, `recent_avg_finish_position`와 동일하지만 구분 가능)

### 2. 세션 결과에서 가져올 수 있음
- ⚠️ `best_lap_time`: 최고 랩타임 (초 단위)
- ⚠️ `laps_complete`: 완주 랩 수
- ⚠️ `laps_led`: 리드 랩 수
- ⚠️ `qualifying_time`: 퀄리파잉 타임 (초 단위)
- ⚠️ `points`: 획득 포인트
- ⚠️ `car_id`: 차량 ID
- ⚠️ `license_level`: 라이선스 레벨

### 3. 상대 전력 추가 통계 (고급)
- ⚠️ `opponent_ir_std`: 상대 iRating 표준편차 (분산도 측정)
- ⚠️ `opponent_ir_median`: 상대 iRating 중앙값
- ⚠️ `opponent_count_above_me`: 내 iRating보다 높은 상대 수
- ⚠️ `opponent_count_below_me`: 내 iRating보다 낮은 상대 수

## Feature 중요도 평가

### 🔴 매우 중요 (현재 수집 중)
- iRating, Safety Rating
- 상대 전력 통계 (avg_opponent_ir, ir_diff_from_avg)
- 최근 성적 (recent_avg_finish_position, win_rate)
- 인시던트율, DNF율

### 🟡 중요 (추가 고려)
- `top5_rate`, `top10_rate`: 이미 계산하므로 저장만 하면 됨
- `best_lap_time`: 페이스 예측에 유용
- `laps_led`: 공격성/리더십 지표
- `car_id`: 차량별 특화 성능

### 🟢 선택적 (낮은 우선순위)
- `qualifying_time`: 시작 순위와 상관관계 높음
- `points`: 완주 순위와 상관관계 높음
- `license_level`: iRating과 상관관계 높음
- `laps_complete`: DNF 여부와 상관관계 높음

## 권장 사항

### 즉시 추가 권장
1. **`top5_rate`, `top10_rate`**: 이미 계산하므로 저장만 추가
2. **`best_lap_time`**: 페이스 예측에 유용
3. **`car_id`**: 차량별 특화 성능 분석 가능

### 향후 추가 고려
- 상대 전력 추가 통계 (표준편차, 중앙값 등)
- `laps_led` (공격성 지표)

