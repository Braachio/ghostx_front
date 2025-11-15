-- iRacing ML 기반 세션 분석 및 예측을 위한 테이블 생성

-- 1. 세션 참가자 통계 테이블 (각 참가자의 상세 통계 저장)
CREATE TABLE IF NOT EXISTS iracing_session_participant_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subsession_id INTEGER NOT NULL,
  cust_id INTEGER NOT NULL,
  
  -- 기본 정보
  display_name TEXT,
  country TEXT,
  car_id INTEGER,
  car_name TEXT,
  
  -- 레이팅 정보
  i_rating INTEGER,
  safety_rating DECIMAL(5, 2),
  i_rating_change INTEGER, -- 최근 변화량
  safety_rating_change DECIMAL(5, 2), -- 최근 변화량
  
  -- 통계 정보 (최근 N경기 기준)
  avg_incidents_per_race DECIMAL(5, 2),
  dnf_rate DECIMAL(5, 4), -- 무사 완주율 = 1 - DNF율
  avg_finish_position DECIMAL(5, 2),
  recent_avg_finish_position DECIMAL(5, 2), -- 최근 5경기 평균
  win_rate DECIMAL(5, 4),
  top5_rate DECIMAL(5, 4),
  top10_rate DECIMAL(5, 4),
  
  -- IR/SR 변화 추세
  ir_trend DECIMAL(5, 2), -- 최근 IR 변화율 (양수=상승, 음수=하락)
  sr_trend DECIMAL(5, 2), -- 최근 SR 변화율
  
  -- SOF 관련
  sof INTEGER, -- Strength of Field
  
  -- 예측 정보 (ML 모델 결과)
  predicted_finish_position DECIMAL(5, 2),
  predicted_finish_confidence DECIMAL(5, 4), -- 0.0 ~ 1.0
  strategy_recommendation TEXT, -- 'aggressive', 'balanced', 'defensive', 'survival'
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subsession_id, cust_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_iracing_session_participant_stats_subsession 
ON iracing_session_participant_stats(subsession_id);

CREATE INDEX IF NOT EXISTS idx_iracing_session_participant_stats_cust 
ON iracing_session_participant_stats(cust_id);

CREATE INDEX IF NOT EXISTS idx_iracing_session_participant_stats_created 
ON iracing_session_participant_stats(created_at);

-- 2. 세션 예측 결과 테이블 (전체 세션에 대한 예측 요약)
CREATE TABLE IF NOT EXISTS iracing_session_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subsession_id INTEGER UNIQUE NOT NULL,
  
  -- 세션 정보
  series_id INTEGER,
  series_name TEXT,
  track_id INTEGER,
  track_name TEXT,
  session_start_time TIMESTAMPTZ,
  
  -- SOF 및 통계
  sof INTEGER,
  avg_i_rating DECIMAL(10, 2),
  avg_safety_rating DECIMAL(5, 2),
  total_participants INTEGER,
  
  -- 예측 정보
  predicted_avg_incidents DECIMAL(5, 2),
  predicted_dnf_rate DECIMAL(5, 4),
  predicted_competitiveness_score DECIMAL(5, 4), -- 0.0 ~ 1.0 (높을수록 경쟁력 높음)
  
  -- 전략 제안
  overall_strategy TEXT, -- 'aggressive', 'balanced', 'defensive', 'survival'
  strategy_details JSONB, -- 상세 전략 정보
  
  -- 모델 정보
  model_version TEXT,
  prediction_confidence DECIMAL(5, 4),
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_iracing_session_predictions_subsession 
ON iracing_session_predictions(subsession_id);

CREATE INDEX IF NOT EXISTS idx_iracing_session_predictions_start_time 
ON iracing_session_predictions(session_start_time);

-- 3. ML 모델 학습 데이터 테이블 (과거 세션 결과 저장)
CREATE TABLE IF NOT EXISTS iracing_ml_training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subsession_id INTEGER NOT NULL,
  cust_id INTEGER NOT NULL,
  
  -- 입력 특성 (Features)
  i_rating INTEGER,
  safety_rating DECIMAL(5, 2),
  avg_incidents_per_race DECIMAL(5, 2),
  dnf_rate DECIMAL(5, 4),
  recent_avg_finish_position DECIMAL(5, 2),
  win_rate DECIMAL(5, 4),
  ir_trend DECIMAL(5, 2),
  sr_trend DECIMAL(5, 2),
  sof INTEGER,
  starting_position INTEGER,
  
  -- 세션 컨텍스트
  series_id INTEGER,
  track_id INTEGER,
  total_participants INTEGER,
  
  -- 실제 결과 (Labels)
  actual_finish_position INTEGER,
  actual_incidents INTEGER,
  actual_dnf BOOLEAN,
  
  -- 메타 정보
  session_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_subsession 
ON iracing_ml_training_data(subsession_id);

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_cust 
ON iracing_ml_training_data(cust_id);

CREATE INDEX IF NOT EXISTS idx_iracing_ml_training_data_session_time 
ON iracing_ml_training_data(session_start_time);

-- 4. ML 모델 메타데이터 테이블
CREATE TABLE IF NOT EXISTS iracing_ml_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'finish_position', 'strategy_recommendation'
  model_version TEXT NOT NULL,
  
  -- 모델 성능 지표
  accuracy DECIMAL(5, 4),
  mean_absolute_error DECIMAL(10, 4),
  r2_score DECIMAL(5, 4),
  
  -- 학습 정보
  training_samples INTEGER,
  training_date TIMESTAMPTZ,
  features_used JSONB, -- 사용된 특성 목록
  
  -- 모델 파일 정보 (S3 또는 저장소 경로)
  model_file_path TEXT,
  model_file_hash TEXT,
  
  -- 상태
  is_active BOOLEAN DEFAULT false,
  is_production BOOLEAN DEFAULT false,
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(model_name, model_version)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_iracing_ml_models_active 
ON iracing_ml_models(is_active, is_production);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_iracing_ml_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_iracing_session_participant_stats_updated_at 
  BEFORE UPDATE ON iracing_session_participant_stats 
  FOR EACH ROW EXECUTE FUNCTION update_iracing_ml_updated_at();

CREATE TRIGGER update_iracing_session_predictions_updated_at 
  BEFORE UPDATE ON iracing_session_predictions 
  FOR EACH ROW EXECUTE FUNCTION update_iracing_ml_updated_at();

CREATE TRIGGER update_iracing_ml_models_updated_at 
  BEFORE UPDATE ON iracing_ml_models 
  FOR EACH ROW EXECUTE FUNCTION update_iracing_ml_updated_at();

