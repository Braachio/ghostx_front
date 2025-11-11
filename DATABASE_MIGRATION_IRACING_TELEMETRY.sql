-- iRacing 텔레메트리 데이터 수집 및 로깅 시스템

-- 텔레메트리 세션 메타데이터
CREATE TABLE IF NOT EXISTS iracing_telemetry_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 세션 정보
  session_name TEXT,
  track_id INTEGER,
  track_name TEXT,
  car_id INTEGER,
  car_name TEXT,
  
  -- 세션 메타데이터
  session_type TEXT, -- 'practice', 'qualifying', 'race', 'time_trial'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds DECIMAL(10, 3),
  
  -- 샘플링 정보
  sample_count INTEGER DEFAULT 0,
  sample_rate_hz DECIMAL(5, 2), -- 샘플링 주파수 (예: 60Hz, 120Hz)
  
  -- 데이터 품질
  data_hash TEXT, -- 중복 검사를 위한 해시
  is_complete BOOLEAN DEFAULT false,
  
  -- 메타데이터
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_user_time 
  ON iracing_telemetry_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_track_car 
  ON iracing_telemetry_sessions(track_id, car_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_sessions_hash 
  ON iracing_telemetry_sessions(data_hash);

-- 텔레메트리 샘플 데이터 (고빈도 데이터)
CREATE TABLE IF NOT EXISTS iracing_telemetry_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES iracing_telemetry_sessions(id) ON DELETE CASCADE,
  
  -- 타임스탬프 (세션 시작부터의 경과 시간, 초)
  elapsed_time DECIMAL(10, 3) NOT NULL,
  
  -- 1. 제어 입력 (Control Inputs) - "1번 데이터"
  throttle_position DECIMAL(5, 3), -- 0.0 ~ 1.0
  brake_position DECIMAL(5, 3), -- 0.0 ~ 1.0
  steering_angle DECIMAL(8, 3), -- 스티어링 각도 (라디안 또는 도)
  clutch_position DECIMAL(5, 3), -- 0.0 ~ 1.0
  
  -- 2. 차량 상태 (Vehicle State)
  speed_ms DECIMAL(8, 3), -- 속도 (m/s)
  speed_kmh DECIMAL(8, 3), -- 속도 (km/h)
  rpm INTEGER,
  gear INTEGER,
  engine_power DECIMAL(10, 2), -- kW
  engine_torque DECIMAL(10, 2), -- N⋅m
  
  -- 3. GPS/위치 데이터 (Location)
  position_x DECIMAL(12, 6), -- 트랙 위치 X (미터)
  position_y DECIMAL(12, 6), -- 트랙 위치 Y (미터)
  position_z DECIMAL(12, 6), -- 트랙 위치 Z (미터)
  latitude DECIMAL(10, 8), -- GPS 위도 (있는 경우)
  longitude DECIMAL(11, 8), -- GPS 경도 (있는 경우)
  heading DECIMAL(8, 3), -- 방향 (도)
  distance_lap DECIMAL(10, 3), -- 랩 시작부터의 거리 (미터)
  
  -- 4. 타이어 데이터 (Tire Data) - "2번 데이터"
  tire_temp_fl DECIMAL(6, 2), -- 전좌 (Celsius)
  tire_temp_fr DECIMAL(6, 2), -- 전우
  tire_temp_rl DECIMAL(6, 2), -- 후좌
  tire_temp_rr DECIMAL(6, 2), -- 후우
  tire_pressure_fl DECIMAL(6, 3), -- 전좌 (kPa)
  tire_pressure_fr DECIMAL(6, 3), -- 전우
  tire_pressure_rl DECIMAL(6, 3), -- 후좌
  tire_pressure_rr DECIMAL(6, 3), -- 후우
  tire_wear_fl DECIMAL(5, 3), -- 전좌 마모 (0.0 ~ 1.0)
  tire_wear_fr DECIMAL(5, 3), -- 전우
  tire_wear_rl DECIMAL(5, 3), -- 후좌
  tire_wear_rr DECIMAL(5, 3), -- 후우
  
  -- 5. 서스펜션/차량 동역학
  suspension_travel_fl DECIMAL(8, 3), -- 전좌 서스펜션 (mm)
  suspension_travel_fr DECIMAL(8, 3),
  suspension_travel_rl DECIMAL(8, 3),
  suspension_travel_rr DECIMAL(8, 3),
  ride_height_fl DECIMAL(8, 3), -- 전좌 로드 높이 (mm)
  ride_height_fr DECIMAL(8, 3),
  ride_height_rl DECIMAL(8, 3),
  ride_height_rr DECIMAL(8, 3),
  
  -- 6. G-Force (가속도)
  g_force_lateral DECIMAL(6, 3), -- 횡방향 G
  g_force_longitudinal DECIMAL(6, 3), -- 종방향 G
  g_force_vertical DECIMAL(6, 3), -- 수직 G
  
  -- 7. 슬립/트랙션
  wheel_slip_fl DECIMAL(5, 3), -- 전좌 휠 슬립
  wheel_slip_fr DECIMAL(5, 3),
  wheel_slip_rl DECIMAL(5, 3),
  wheel_slip_rr DECIMAL(5, 3),
  
  -- 8. 브레이크/ABS
  brake_temperature_fl DECIMAL(6, 2), -- 전좌 브레이크 온도
  brake_temperature_fr DECIMAL(6, 2),
  brake_temperature_rl DECIMAL(6, 2),
  brake_temperature_rr DECIMAL(6, 2),
  abs_active BOOLEAN,
  traction_control_active BOOLEAN,
  
  -- 9. 추가 메타데이터
  lap_number INTEGER,
  sector_number INTEGER,
  fuel_level DECIMAL(8, 3), -- 리터
  fuel_pressure DECIMAL(8, 3), -- kPa
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_telemetry_samples_session_time 
  ON iracing_telemetry_samples(session_id, elapsed_time);
CREATE INDEX IF NOT EXISTS idx_telemetry_samples_session_lap 
  ON iracing_telemetry_samples(session_id, lap_number);

-- 파티셔닝 고려: 시간 기반 파티셔닝 (선택사항, 대용량 시)
-- CREATE TABLE iracing_telemetry_samples_2024_01 PARTITION OF iracing_telemetry_samples
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 분석 결과 저장 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS iracing_telemetry_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES iracing_telemetry_sessions(id) ON DELETE CASCADE,
  
  -- 분석 타입
  analysis_type TEXT NOT NULL, -- 'corner_analysis', 'braking_analysis', 'lap_comparison' 등
  
  -- 분석 결과 (JSON)
  analysis_data JSONB NOT NULL,
  
  -- 분석 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_analysis_session 
  ON iracing_telemetry_analysis(session_id, analysis_type);

-- RLS 정책 (선택사항)
-- ALTER TABLE iracing_telemetry_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE iracing_telemetry_samples ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
-- CREATE POLICY "Users can view own sessions" ON iracing_telemetry_sessions
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own sessions" ON iracing_telemetry_sessions
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can view own samples" ON iracing_telemetry_samples
--   FOR SELECT USING (auth.uid() = (SELECT user_id FROM iracing_telemetry_sessions WHERE id = session_id));

