-- 상대 전력 통계 필드 추가 (ML 학습 데이터 테이블)
-- 상대들의 iRating 통계를 저장하여 상대 전력 기반 예측 가능하도록 함

ALTER TABLE iracing_ml_training_data
ADD COLUMN IF NOT EXISTS avg_opponent_ir INTEGER,
ADD COLUMN IF NOT EXISTS max_opponent_ir INTEGER,
ADD COLUMN IF NOT EXISTS min_opponent_ir INTEGER,
ADD COLUMN IF NOT EXISTS ir_diff_from_avg INTEGER; -- 내 iRating - 평균 상대 iRating

-- 인덱스 추가 (상대 전력 기반 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_opponent_stats 
ON iracing_ml_training_data(avg_opponent_ir, ir_diff_from_avg);

-- 코멘트 추가
COMMENT ON COLUMN iracing_ml_training_data.avg_opponent_ir IS '상대들의 평균 iRating (나를 제외)';
COMMENT ON COLUMN iracing_ml_training_data.max_opponent_ir IS '상대들의 최고 iRating';
COMMENT ON COLUMN iracing_ml_training_data.min_opponent_ir IS '상대들의 최저 iRating';
COMMENT ON COLUMN iracing_ml_training_data.ir_diff_from_avg IS '내 iRating과 상대 평균 iRating의 차이 (양수=내가 높음, 음수=내가 낮음)';

