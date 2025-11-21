-- iRacing ML 학습 데이터에 추가 특성 컬럼 추가
-- 퀄리파잉, 프랙티스, 날씨, 시간대 정보

ALTER TABLE iracing_ml_training_data
ADD COLUMN IF NOT EXISTS qualifying_position INTEGER,
ADD COLUMN IF NOT EXISTS qualifying_best_lap_time DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS practice_best_lap_time DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS weather_temp DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS track_temp DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS relative_humidity DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS wind_speed DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS wind_direction INTEGER,
ADD COLUMN IF NOT EXISTS skies INTEGER,
ADD COLUMN IF NOT EXISTS fog DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS day_of_week INTEGER, -- 0=일요일, 6=토요일
ADD COLUMN IF NOT EXISTS hour_of_day INTEGER; -- 0~23

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_ml_training_qualifying_position 
  ON iracing_ml_training_data(qualifying_position) 
  WHERE qualifying_position IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ml_training_day_hour 
  ON iracing_ml_training_data(day_of_week, hour_of_day) 
  WHERE day_of_week IS NOT NULL AND hour_of_day IS NOT NULL;
