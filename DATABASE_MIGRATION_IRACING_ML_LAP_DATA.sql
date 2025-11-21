-- iRacing ML 학습 데이터에 추가 주행 데이터 필드 추가
-- 각 랩의 개별 랩타임 배열은 iRacing API에서 제공하지 않을 수 있으므로,
-- 가능한 주행 관련 통계 데이터만 수집

ALTER TABLE iracing_ml_training_data
ADD COLUMN IF NOT EXISTS fastest_lap_time DECIMAL(10, 4), -- 최고 랩타임 (best_lap_time과 동일할 수 있음)
ADD COLUMN IF NOT EXISTS fastest_lap_num INTEGER, -- 최고 랩타임 랩 번호
ADD COLUMN IF NOT EXISTS fastest_qualifying_lap_time DECIMAL(10, 4), -- 최고 퀄리파잉 랩타임
ADD COLUMN IF NOT EXISTS fastest_qualifying_lap_num INTEGER, -- 최고 퀄리파잉 랩타임 랩 번호
ADD COLUMN IF NOT EXISTS fastest_race_lap_time DECIMAL(10, 4), -- 최고 레이스 랩타임
ADD COLUMN IF NOT EXISTS fastest_race_lap_num INTEGER, -- 최고 레이스 랩타임 랩 번호
ADD COLUMN IF NOT EXISTS total_laps INTEGER, -- 총 랩 수
ADD COLUMN IF NOT EXISTS laps_led_pct DECIMAL(5, 2); -- 리드 랩 비율 (%)

-- 인덱스 추가 (자주 조회되는 필드)
CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_fastest_lap_time 
ON iracing_ml_training_data(fastest_lap_time) WHERE fastest_lap_time IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_total_laps 
ON iracing_ml_training_data(total_laps) WHERE total_laps IS NOT NULL;


