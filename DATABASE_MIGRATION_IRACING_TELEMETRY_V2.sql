-- iRacing 텔레메트리 데이터 분리 구조 (lap_meta/lap_controls/lap_vehicle_status 패턴 적용)
-- 기존 iracing_telemetry_samples 테이블을 분리하여 성능 최적화

-- 1. 제어 입력 데이터 (Controls)
CREATE TABLE IF NOT EXISTS iracing_telemetry_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES iracing_telemetry_sessions(id) ON DELETE CASCADE,
  elapsed_time DECIMAL(10, 3) NOT NULL,
  
  -- 제어 입력
  throttle_position DECIMAL(5, 3), -- 0.0 ~ 1.0
  brake_position DECIMAL(5, 3), -- 0.0 ~ 1.0
  steering_angle DECIMAL(8, 3), -- 스티어링 각도 (라디안 또는 도)
  clutch_position DECIMAL(5, 3), -- 0.0 ~ 1.0
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_controls_session_time 
  ON iracing_telemetry_controls(session_id, elapsed_time);

-- 2. 차량 상태 및 위치 데이터 (Vehicle + Location)
CREATE TABLE IF NOT EXISTS iracing_telemetry_vehicle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES iracing_telemetry_sessions(id) ON DELETE CASCADE,
  elapsed_time DECIMAL(10, 3) NOT NULL,
  
  -- 차량 기본 상태
  speed_ms DECIMAL(8, 3), -- 속도 (m/s)
  speed_kmh DECIMAL(8, 3), -- 속도 (km/h)
  rpm INTEGER,
  gear INTEGER,
  engine_power DECIMAL(10, 2), -- kW
  engine_torque DECIMAL(10, 2), -- N⋅m
  
  -- GPS/위치 데이터
  position_x DECIMAL(12, 6), -- 트랙 위치 X (미터)
  position_y DECIMAL(12, 6), -- 트랙 위치 Y (미터)
  position_z DECIMAL(12, 6), -- 트랙 위치 Z (미터)
  latitude DECIMAL(10, 8), -- GPS 위도 (있는 경우)
  longitude DECIMAL(11, 8), -- GPS 경도 (있는 경우)
  heading DECIMAL(8, 3), -- 방향 (도)
  distance_lap DECIMAL(10, 3), -- 랩 시작부터의 거리 (미터)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_session_time 
  ON iracing_telemetry_vehicle(session_id, elapsed_time);
CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_position 
  ON iracing_telemetry_vehicle(session_id, position_x, position_y) 
  WHERE position_x IS NOT NULL AND position_y IS NOT NULL;

-- 3. 타이어 및 고급 동역학 데이터 (Tires + Advanced Dynamics)
CREATE TABLE IF NOT EXISTS iracing_telemetry_advanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES iracing_telemetry_sessions(id) ON DELETE CASCADE,
  elapsed_time DECIMAL(10, 3) NOT NULL,
  
  -- 타이어 데이터
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
  
  -- 서스펜션
  suspension_travel_fl DECIMAL(8, 3), -- 전좌 서스펜션 (mm)
  suspension_travel_fr DECIMAL(8, 3),
  suspension_travel_rl DECIMAL(8, 3),
  suspension_travel_rr DECIMAL(8, 3),
  ride_height_fl DECIMAL(8, 3), -- 전좌 로드 높이 (mm)
  ride_height_fr DECIMAL(8, 3),
  ride_height_rl DECIMAL(8, 3),
  ride_height_rr DECIMAL(8, 3),
  
  -- G-Force (가속도)
  g_force_lateral DECIMAL(6, 3), -- 횡방향 G
  g_force_longitudinal DECIMAL(6, 3), -- 종방향 G
  g_force_vertical DECIMAL(6, 3), -- 수직 G
  
  -- 슬립/트랙션
  wheel_slip_fl DECIMAL(5, 3), -- 전좌 휠 슬립
  wheel_slip_fr DECIMAL(5, 3),
  wheel_slip_rl DECIMAL(5, 3),
  wheel_slip_rr DECIMAL(5, 3),
  
  -- 브레이크/ABS
  brake_temperature_fl DECIMAL(6, 2), -- 전좌 브레이크 온도
  brake_temperature_fr DECIMAL(6, 2),
  brake_temperature_rl DECIMAL(6, 2),
  brake_temperature_rr DECIMAL(6, 2),
  abs_active BOOLEAN,
  traction_control_active BOOLEAN,
  
  -- 추가 메타데이터
  lap_number INTEGER,
  sector_number INTEGER,
  fuel_level DECIMAL(8, 3), -- 리터
  fuel_pressure DECIMAL(8, 3), -- kPa
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_advanced_session_time 
  ON iracing_telemetry_advanced(session_id, elapsed_time);
CREATE INDEX IF NOT EXISTS idx_telemetry_advanced_session_lap 
  ON iracing_telemetry_advanced(session_id, lap_number);

-- 기존 iracing_telemetry_samples 테이블은 유지 (마이그레이션 후 삭제 가능)



