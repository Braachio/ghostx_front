-- ML 학습 데이터 테이블에 추가 Feature 필드 추가

ALTER TABLE iracing_ml_training_data
ADD COLUMN IF NOT EXISTS top5_rate DECIMAL(5, 4),
ADD COLUMN IF NOT EXISTS top10_rate DECIMAL(5, 4),
ADD COLUMN IF NOT EXISTS avg_finish_position DECIMAL(5, 2), -- 전체 평균 (recent와 구분)
ADD COLUMN IF NOT EXISTS best_lap_time DECIMAL(10, 4), -- 최고 랩타임 (초)
ADD COLUMN IF NOT EXISTS laps_led INTEGER, -- 리드 랩 수
ADD COLUMN IF NOT EXISTS laps_complete INTEGER, -- 완주 랩 수
ADD COLUMN IF NOT EXISTS qualifying_time DECIMAL(10, 4), -- 퀄리파잉 타임 (초)
ADD COLUMN IF NOT EXISTS points INTEGER, -- 획득 포인트
ADD COLUMN IF NOT EXISTS car_id INTEGER, -- 차량 ID
ADD COLUMN IF NOT EXISTS license_level INTEGER; -- 라이선스 레벨

-- 인덱스 추가 (차량별 분석 최적화)
CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_car_id 
ON iracing_ml_training_data(car_id);

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_track_id 
ON iracing_ml_training_data(track_id);

-- 코멘트 추가
COMMENT ON COLUMN iracing_ml_training_data.top5_rate IS '최근 Top5율 (최근 5경기)';
COMMENT ON COLUMN iracing_ml_training_data.top10_rate IS '최근 Top10율 (최근 5경기)';
COMMENT ON COLUMN iracing_ml_training_data.avg_finish_position IS '전체 평균 완주 순위 (최근 5경기, recent_avg_finish_position와 동일하지만 구분)';
COMMENT ON COLUMN iracing_ml_training_data.best_lap_time IS '최고 랩타임 (초 단위)';
COMMENT ON COLUMN iracing_ml_training_data.laps_led IS '리드 랩 수 (공격성 지표)';
COMMENT ON COLUMN iracing_ml_training_data.laps_complete IS '완주 랩 수';
COMMENT ON COLUMN iracing_ml_training_data.qualifying_time IS '퀄리파잉 타임 (초 단위)';
COMMENT ON COLUMN iracing_ml_training_data.points IS '획득 포인트';
COMMENT ON COLUMN iracing_ml_training_data.car_id IS '차량 ID (차량별 특화 성능 분석)';
COMMENT ON COLUMN iracing_ml_training_data.license_level IS '라이선스 레벨';

