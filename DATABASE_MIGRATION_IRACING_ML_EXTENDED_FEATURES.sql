-- iRacing ML 학습 데이터에 추가 필드 추가
-- 세션 전략 및 순위 예측에 활용할 수 있는 모든 데이터 수집

ALTER TABLE iracing_ml_training_data
ADD COLUMN IF NOT EXISTS finish_position_in_class INTEGER,
ADD COLUMN IF NOT EXISTS interval DECIMAL(10, 4), -- 앞 차와의 간격 (초)
ADD COLUMN IF NOT EXISTS interval_units TEXT, -- 's' (초) 또는 'l' (랩)
ADD COLUMN IF NOT EXISTS reason_out_id INTEGER, -- DNF 이유 ID
ADD COLUMN IF NOT EXISTS reason_out_text TEXT, -- DNF 이유 텍스트
ADD COLUMN IF NOT EXISTS average_lap_time DECIMAL(10, 4), -- 평균 랩타임 (초)
ADD COLUMN IF NOT EXISTS best_lap_num INTEGER, -- 베스트 랩 번호
ADD COLUMN IF NOT EXISTS weight_penalty_kg DECIMAL(5, 2), -- 무게 페널티 (kg)
ADD COLUMN IF NOT EXISTS irating_change INTEGER, -- 레이팅 변화량
ADD COLUMN IF NOT EXISTS safety_rating_change DECIMAL(5, 2), -- Safety Rating 변화량
ADD COLUMN IF NOT EXISTS team_id INTEGER, -- 팀 ID
ADD COLUMN IF NOT EXISTS team_name TEXT, -- 팀 이름
ADD COLUMN IF NOT EXISTS car_class_id INTEGER, -- 차량 클래스 ID
ADD COLUMN IF NOT EXISTS car_class_name TEXT, -- 차량 클래스 이름
ADD COLUMN IF NOT EXISTS track_config TEXT, -- 트랙 설정 (예: "road", "oval")
ADD COLUMN IF NOT EXISTS event_strength_of_field INTEGER, -- 실제 SOF (이벤트에서 제공)
ADD COLUMN IF NOT EXISTS event_average_lap DECIMAL(10, 4), -- 이벤트 평균 랩타임
ADD COLUMN IF NOT EXISTS event_average_incidents DECIMAL(5, 2), -- 이벤트 평균 인시던트
ADD COLUMN IF NOT EXISTS session_type TEXT, -- 세션 타입 (예: "Race", "Qualify")
ADD COLUMN IF NOT EXISTS series_name TEXT, -- 시리즈 이름
ADD COLUMN IF NOT EXISTS season_id INTEGER, -- 시즌 ID
ADD COLUMN IF NOT EXISTS season_name TEXT, -- 시즌 이름
ADD COLUMN IF NOT EXISTS track_shared_id INTEGER; -- 트랙 공유 ID

-- 인덱스 추가 (자주 조회되는 필드)
CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_team_id 
ON iracing_ml_training_data(team_id) WHERE team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_car_class_id 
ON iracing_ml_training_data(car_class_id) WHERE car_class_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_event_sof 
ON iracing_ml_training_data(event_strength_of_field) WHERE event_strength_of_field IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_series_id 
ON iracing_ml_training_data(series_id) WHERE series_id IS NOT NULL;




