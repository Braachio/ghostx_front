-- iRacing 메타 차량 데이터 분석을 위한 테이블 생성

-- 세션 결과 원본 데이터
CREATE TABLE IF NOT EXISTS iracing_subsession_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subsession_id INTEGER UNIQUE NOT NULL,
  series_id INTEGER NOT NULL,
  season_id INTEGER NOT NULL,
  session_name TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  track_id INTEGER NOT NULL,
  track_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iracing_subsession_series_time 
  ON iracing_subsession_results(series_id, start_time);
CREATE INDEX IF NOT EXISTS idx_iracing_subsession_track_time 
  ON iracing_subsession_results(track_id, start_time);

-- 참여자 결과
CREATE TABLE IF NOT EXISTS iracing_participant_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subsession_id INTEGER NOT NULL,
  cust_id INTEGER NOT NULL,
  display_name TEXT,
  finish_position INTEGER NOT NULL,
  starting_position INTEGER,
  i_rating INTEGER,
  best_lap_time DECIMAL(10, 3),
  laps_complete INTEGER,
  car_id INTEGER NOT NULL,
  car_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iracing_participant_subsession 
  ON iracing_participant_results(subsession_id);
CREATE INDEX IF NOT EXISTS idx_iracing_participant_car_series 
  ON iracing_participant_results(car_id, subsession_id);
CREATE INDEX IF NOT EXISTS idx_iracing_participant_finish 
  ON iracing_participant_results(finish_position);

-- 참여자 결과 테이블에 외래키 제약 조건 추가 (세션 삭제 시 참조 무결성)
ALTER TABLE iracing_participant_results
  ADD CONSTRAINT fk_iracing_participant_subsession
  FOREIGN KEY (subsession_id) 
  REFERENCES iracing_subsession_results(subsession_id)
  ON DELETE CASCADE;

-- 메타 차량 통계 테이블 (집계된 통계 저장)
CREATE TABLE IF NOT EXISTS iracing_meta_vehicle_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id INTEGER NOT NULL,
  car_name TEXT NOT NULL,
  series_id INTEGER NOT NULL,
  series_name TEXT NOT NULL,
  track_id INTEGER,
  track_name TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_races INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  top5_finishes INTEGER NOT NULL DEFAULT 0,
  top5_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  pick_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  avg_lap_time DECIMAL(10, 3),
  irating_bins JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(car_id, series_id, track_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_iracing_meta_vehicle_series 
  ON iracing_meta_vehicle_stats(series_id, period_start);
CREATE INDEX IF NOT EXISTS idx_iracing_meta_vehicle_car 
  ON iracing_meta_vehicle_stats(car_id);

-- BoP 패치 이력
CREATE TABLE IF NOT EXISTS iracing_bop_patches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patch_date TIMESTAMPTZ NOT NULL,
  series_id INTEGER,
  description TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iracing_bop_patch_date 
  ON iracing_bop_patches(patch_date, series_id);

-- RLS 정책 설정 (선택사항 - 필요시 활성화)
-- ALTER TABLE iracing_subsession_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE iracing_participant_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE iracing_meta_vehicle_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE iracing_bop_patches ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (모든 사용자가 읽기 가능)
-- CREATE POLICY "Public read access" ON iracing_subsession_results FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON iracing_participant_results FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON iracing_meta_vehicle_stats FOR SELECT USING (true);
-- CREATE POLICY "Public read access" ON iracing_bop_patches FOR SELECT USING (true);
