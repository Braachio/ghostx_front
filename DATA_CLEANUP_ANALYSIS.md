# iRacing ML 학습 데이터 정제 분석

## 현재 데이터 상태 (총 31,025개 레코드)

### ✅ 수집 가능한 필드 (높은 비율)

| 필드명 | 비율 | 비고 |
|--------|------|------|
| `i_rating` | 100.00% | 모두 수집됨 |
| `safety_rating` | 100.00% | 모두 수집됨 |
| `best_lap_time` | 99.75% | 거의 모두 수집됨 |
| `laps_complete` | 99.75% | 거의 모두 수집됨 |
| `license_level` | 99.75% | 거의 모두 수집됨 |
| `average_lap_time` | 38.31% | 일부만 수집됨 |

### ❌ 수집 불가능한 필드 (0% 또는 매우 낮음)

| 필드명 | 비율 | 원인 |
|--------|------|------|
| `avg_incidents_per_race` | 0.00% | 최근 레이스 데이터 없음 |
| `dnf_rate` | 0.00% | 최근 레이스 데이터 없음 |
| `recent_avg_finish_position` | 0.00% | 최근 레이스 데이터 없음 |
| `win_rate` | 0.00% | 최근 레이스 데이터 없음 |
| `top5_rate` | 0.00% | 최근 레이스 데이터 없음 |
| `top10_rate` | 0.00% | 최근 레이스 데이터 없음 |
| `ir_trend` | 0.00% | 최근 레이스 데이터 없음 |
| `sr_trend` | 0.00% | 최근 레이스 데이터 없음 |
| `fastest_lap_time` | 0.00% | API에서 제공하지 않음 |
| `fastest_qualifying_lap_time` | 0.00% | API에서 제공하지 않음 |
| `fastest_race_lap_time` | 0.00% | API에서 제공하지 않음 |
| `qualifying_time` | 0.00% | API에서 제공하지 않음 |
| `laps_led` | 0.00% | API에서 제공하지 않음 |
| `laps_led_pct` | 0.00% | API에서 제공하지 않음 |
| `points` | 0.00% | API에서 제공하지 않음 |
| `team_id` | 0.00% | 팀 레이스가 아닌 경우 |

## 원인 분석

### 1. 최근 레이스 데이터 부족
- `extractFeaturesFromRecentRaces` 함수는 `/data/stats/member_recent_races` API를 사용
- 이 API가 데이터를 반환하지 않거나, 최근 레이스가 없는 경우가 많음
- 결과: `avg_incidents_per_race`, `dnf_rate`, `recent_avg_finish_position` 등이 모두 null

### 2. iRacing API 제한
- 일부 필드는 API 응답에 포함되지 않음
- 예: `fastest_lap_time`, `fastest_qualifying_lap_time` 등은 `best_lap_time`만 제공

### 3. 세션 타입에 따른 필드 차이
- 팀 레이스가 아닌 경우 `team_id`는 null
- 클래스별 레이스가 아닌 경우 일부 필드가 null

## 정제 계획

### 1단계: 불필요한 컬럼 제거 (또는 nullable 유지)

다음 컬럼들은 ML 모델 학습에 사용할 수 없으므로 제거 고려:
- `fastest_lap_time` (0% - `best_lap_time`과 중복 가능성)
- `fastest_qualifying_lap_time` (0%)
- `fastest_race_lap_time` (0%)
- `fastest_lap_num` (0%)
- `fastest_qualifying_lap_num` (0%)
- `fastest_race_lap_num` (0%)
- `qualifying_time` (0%)
- `laps_led` (0%)
- `laps_led_pct` (0%)
- `points` (0%)

### 2단계: 최근 레이스 데이터 수집 개선

`/data/stats/member_recent_races` API 응답 확인 및 개선 필요:
- API가 실제로 데이터를 반환하는지 확인
- 응답 구조 확인
- 에러 처리 개선

### 3단계: ML 모델 학습용 필드 선별

**사용 가능한 필드 (높은 비율):**
- `i_rating` (100%)
- `safety_rating` (100%)
- `best_lap_time` (99.75%)
- `laps_complete` (99.75%)
- `average_lap_time` (38.31% - 일부만)
- `starting_position` (확인 필요)
- `sof` (확인 필요)
- `total_participants` (확인 필요)
- `avg_opponent_ir` (확인 필요)
- `max_opponent_ir` (확인 필요)
- `min_opponent_ir` (확인 필요)
- `ir_diff_from_avg` (확인 필요)

**사용 불가능한 필드 (0%):**
- 최근 레이스 통계 관련 필드들 (최근 레이스 데이터 부족)
- API에서 제공하지 않는 필드들

## 권장 사항

1. **즉시 조치**: 불필요한 컬럼 제거 또는 nullable 유지
2. **단기 조치**: 최근 레이스 데이터 수집 로직 개선
3. **장기 조치**: ML 모델 학습 시 사용 가능한 필드만 선별하여 학습


