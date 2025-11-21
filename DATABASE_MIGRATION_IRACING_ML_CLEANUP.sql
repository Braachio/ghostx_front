-- iRacing ML 학습 데이터 정제: 불필요한 컬럼 제거
-- API에서 제공하지 않거나 수집 불가능한 필드 제거

-- 참고: 컬럼을 완전히 삭제하는 대신, nullable로 유지하는 것을 권장합니다.
-- 이유: 향후 API가 해당 필드를 제공할 수 있고, 기존 데이터와의 호환성을 유지하기 위함

-- 하지만 사용자가 명시적으로 제거를 원하는 경우, 아래 주석을 해제하여 실행할 수 있습니다.

/*
-- 1. API에서 제공하지 않는 필드 제거
ALTER TABLE iracing_ml_training_data
DROP COLUMN IF EXISTS fastest_lap_time,
DROP COLUMN IF EXISTS fastest_lap_num,
DROP COLUMN IF EXISTS fastest_qualifying_lap_time,
DROP COLUMN IF EXISTS fastest_qualifying_lap_num,
DROP COLUMN IF EXISTS fastest_race_lap_time,
DROP COLUMN IF EXISTS fastest_race_lap_num,
DROP COLUMN IF EXISTS qualifying_time,
DROP COLUMN IF EXISTS laps_led,
DROP COLUMN IF EXISTS laps_led_pct,
DROP COLUMN IF EXISTS points;

-- 2. 최근 레이스 데이터가 없어서 수집 불가능한 필드 제거
-- (향후 최근 레이스 데이터 수집이 개선되면 다시 추가 가능)
ALTER TABLE iracing_ml_training_data
DROP COLUMN IF EXISTS avg_incidents_per_race,
DROP COLUMN IF EXISTS dnf_rate,
DROP COLUMN IF EXISTS recent_avg_finish_position,
DROP COLUMN IF EXISTS win_rate,
DROP COLUMN IF EXISTS top5_rate,
DROP COLUMN IF EXISTS top10_rate,
DROP COLUMN IF EXISTS ir_trend,
DROP COLUMN IF EXISTS sr_trend;
*/

-- 대안: 컬럼을 유지하되, ML 모델 학습 시 사용하지 않도록 필터링
-- 이 방법이 더 안전하며, 향후 데이터 수집이 개선되면 사용할 수 있습니다.

-- ML 모델 학습용 필드 목록 (사용 가능한 필드만)
-- 다음 필드들은 높은 비율로 수집되고 있으므로 ML 모델 학습에 사용 가능:
-- - i_rating (100%)
-- - safety_rating (100%)
-- - best_lap_time (99.75%)
-- - laps_complete (99.75%)
-- - average_lap_time (38.31% - 일부만, null 처리 필요)
-- - starting_position
-- - sof
-- - total_participants
-- - avg_opponent_ir
-- - max_opponent_ir
-- - min_opponent_ir
-- - ir_diff_from_avg
-- - actual_finish_position (타겟 변수)

-- 데이터 품질 확인 쿼리
-- SELECT 
--   COUNT(*) as total,
--   COUNT(i_rating) as has_i_rating,
--   COUNT(safety_rating) as has_safety_rating,
--   COUNT(best_lap_time) as has_best_lap_time,
--   COUNT(average_lap_time) as has_average_lap_time,
--   COUNT(starting_position) as has_starting_position,
--   COUNT(sof) as has_sof,
--   COUNT(avg_opponent_ir) as has_avg_opponent_ir,
--   COUNT(actual_finish_position) as has_actual_finish
-- FROM iracing_ml_training_data;


