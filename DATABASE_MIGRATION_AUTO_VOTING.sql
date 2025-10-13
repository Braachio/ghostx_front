-- 자동 투표 스케줄링을 위한 컬럼 추가
-- multis 테이블에 자동 투표 설정 추가
ALTER TABLE multis 
ADD COLUMN IF NOT EXISTS auto_voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voting_start_offset_days INTEGER DEFAULT 1, -- 이벤트 시작 몇 일 전에 투표 시작
ADD COLUMN IF NOT EXISTS voting_duration_days INTEGER DEFAULT 5; -- 투표 지속 기간

-- 투표 스케줄 테이블 생성 (자동 투표 일정 관리)
CREATE TABLE IF NOT EXISTS voting_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_event_id UUID REFERENCES multis(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  voting_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(regular_event_id, week_number, year)
);

-- 투표 스케줄 인덱스
CREATE INDEX IF NOT EXISTS idx_voting_schedules_event_week ON voting_schedules(regular_event_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_voting_schedules_start_time ON voting_schedules(voting_start_time);
CREATE INDEX IF NOT EXISTS idx_voting_schedules_end_time ON voting_schedules(voting_end_time);
CREATE INDEX IF NOT EXISTS idx_voting_schedules_processed ON voting_schedules(is_processed);

-- RLS 정책
ALTER TABLE voting_schedules ENABLE ROW LEVEL SECURITY;

-- 투표 스케줄 조회 정책
CREATE POLICY "Anyone can view voting schedules" ON voting_schedules
  FOR SELECT USING (true);

-- 투표 스케줄 생성/수정 정책 (이벤트 작성자만)
CREATE POLICY "Event creators can manage voting schedules" ON voting_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = voting_schedules.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );

-- 자동 투표 스케줄 생성 함수
CREATE OR REPLACE FUNCTION create_voting_schedule_for_week(
  p_regular_event_id UUID,
  p_week_number INTEGER,
  p_year INTEGER,
  p_event_day_of_week INTEGER, -- 0=일요일, 1=월요일, ..., 6=토요일
  p_start_time TIME,
  p_voting_start_offset_days INTEGER DEFAULT 1,
  p_voting_duration_days INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  schedule_id UUID;
  event_date DATE;
  voting_start_date DATE;
  voting_end_date DATE;
  voting_start_datetime TIMESTAMP WITH TIME ZONE;
  voting_end_datetime TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 해당 주차의 해당 요일 날짜 계산
  event_date := date_trunc('week', make_date(p_year, 1, 1) + (p_week_number - 1) * interval '7 days')::date + p_event_day_of_week;
  
  -- 투표 시작일 계산 (이벤트 시작 전 N일)
  voting_start_date := event_date - p_voting_start_offset_days;
  
  -- 투표 종료일 계산 (투표 시작 후 N일)
  voting_end_date := voting_start_date + p_voting_duration_days;
  
  -- 투표 시작/종료 시간 설정
  voting_start_datetime := (voting_start_date::text || ' 00:00:00')::timestamp with time zone;
  voting_end_datetime := (voting_end_date::text || ' 23:59:59')::timestamp with time zone;
  
  -- 투표 스케줄 생성
  INSERT INTO voting_schedules (
    regular_event_id,
    week_number,
    year,
    voting_start_time,
    voting_end_time
  ) VALUES (
    p_regular_event_id,
    p_week_number,
    p_year,
    voting_start_datetime,
    voting_end_datetime
  )
  ON CONFLICT (regular_event_id, week_number, year) 
  DO UPDATE SET
    voting_start_time = EXCLUDED.voting_start_time,
    voting_end_time = EXCLUDED.voting_end_time,
    updated_at = NOW()
  RETURNING id INTO schedule_id;
  
  RETURN schedule_id;
END;
$$ LANGUAGE plpgsql;

-- 투표 결과를 이벤트에 적용하는 함수
CREATE OR REPLACE FUNCTION apply_voting_results_to_event(
  p_regular_event_id UUID,
  p_week_number INTEGER,
  p_year INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  winning_track TEXT;
  winning_car_class TEXT;
  track_votes INTEGER;
  car_class_votes INTEGER;
BEGIN
  -- 트랙 투표에서 1등 옵션 찾기
  SELECT option_value, votes_count INTO winning_track, track_votes
  FROM regular_event_vote_options
  WHERE regular_event_id = p_regular_event_id 
    AND week_number = p_week_number 
    AND year = p_year
    AND option_type = 'track'
  ORDER BY votes_count DESC, created_at ASC
  LIMIT 1;
  
  -- 차량 클래스 투표에서 1등 옵션 찾기
  SELECT option_value, votes_count INTO winning_car_class, car_class_votes
  FROM regular_event_vote_options
  WHERE regular_event_id = p_regular_event_id 
    AND week_number = p_week_number 
    AND year = p_year
    AND option_type = 'car_class'
  ORDER BY votes_count DESC, created_at ASC
  LIMIT 1;
  
  -- 투표 결과가 있는 경우에만 이벤트 정보 업데이트
  IF winning_track IS NOT NULL AND winning_car_class IS NOT NULL THEN
    -- multis 테이블에서 해당 주차의 이벤트 정보 업데이트
    -- 정기 이벤트의 경우, 해당 주차에 대한 임시 이벤트 생성 또는 업데이트
    INSERT INTO multis (
      title,
      description,
      game,
      game_track,
      multi_class,
      multi_day,
      multi_time,
      max_participants,
      duration_hours,
      gallery_link,
      event_type,
      is_template_based,
      is_open,
      author_id,
      week,
      year,
      event_date,
      auto_voting_enabled,
      voting_start_offset_days,
      voting_duration_days
    )
    SELECT 
      m.title || ' (' || p_year || '년 ' || p_week_number || '주차)',
      m.description,
      m.game,
      winning_track,
      winning_car_class,
      m.multi_day,
      m.multi_time,
      m.max_participants,
      m.duration_hours,
      m.gallery_link,
      'flash_event', -- 투표 결과가 적용된 이벤트는 플래시 이벤트로 분류
      false,
      true,
      m.author_id,
      p_week_number,
      p_year,
      -- 해당 주차의 해당 요일 날짜 계산
      date_trunc('week', make_date(p_year, 1, 1) + (p_week_number - 1) * interval '7 days')::date + 
      CASE m.multi_day[1]
        WHEN '일' THEN 0
        WHEN '월' THEN 1
        WHEN '화' THEN 2
        WHEN '수' THEN 3
        WHEN '목' THEN 4
        WHEN '금' THEN 5
        WHEN '토' THEN 6
        ELSE 1
      END,
      false, -- 투표 결과 이벤트는 자동 투표 비활성화
      NULL,
      NULL
    FROM multis m
    WHERE m.id = p_regular_event_id
    ON CONFLICT (title, week, year, event_type) 
    DO UPDATE SET
      game_track = EXCLUDED.game_track,
      multi_class = EXCLUDED.multi_class,
      updated_at = NOW();
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 자동 투표 처리 함수 (크론잡에서 호출)
CREATE OR REPLACE FUNCTION process_voting_schedules()
RETURNS TABLE(processed_count INTEGER, opened_count INTEGER, closed_count INTEGER, applied_results INTEGER) AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW();
  processed_total INTEGER := 0;
  opened_total INTEGER := 0;
  closed_total INTEGER := 0;
  applied_results_total INTEGER := 0;
  schedule_record RECORD;
BEGIN
  -- 투표 시작해야 할 스케줄들 처리
  FOR schedule_record IN 
    SELECT vs.*, m.multi_day, m.multi_time, m.auto_voting_enabled
    FROM voting_schedules vs
    JOIN multis m ON m.id = vs.regular_event_id
    WHERE vs.voting_start_time <= current_time 
      AND vs.voting_end_time > current_time
      AND vs.is_processed = false
      AND m.auto_voting_enabled = true
  LOOP
    -- 투표 옵션들의 voting_closed를 false로 설정 (투표 재개)
    UPDATE regular_event_vote_options 
    SET voting_closed = false
    WHERE regular_event_id = schedule_record.regular_event_id 
      AND week_number = schedule_record.week_number 
      AND year = schedule_record.year;
    
    -- 스케줄을 처리 완료로 표시
    UPDATE voting_schedules 
    SET is_processed = true, updated_at = current_time
    WHERE id = schedule_record.id;
    
    opened_total := opened_total + 1;
    processed_total := processed_total + 1;
  END LOOP;
  
  -- 투표 종료해야 할 스케줄들 처리
  FOR schedule_record IN 
    SELECT vs.*, m.auto_voting_enabled
    FROM voting_schedules vs
    JOIN multis m ON m.id = vs.regular_event_id
    WHERE vs.voting_end_time <= current_time 
      AND vs.is_processed = true
      AND m.auto_voting_enabled = true
  LOOP
    -- 투표 옵션들의 voting_closed를 true로 설정 (투표 종료)
    UPDATE regular_event_vote_options 
    SET voting_closed = true
    WHERE regular_event_id = schedule_record.regular_event_id 
      AND week_number = schedule_record.week_number 
      AND year = schedule_record.year;
    
    -- 투표 결과를 이벤트에 적용
    IF apply_voting_results_to_event(
      schedule_record.regular_event_id,
      schedule_record.week_number,
      schedule_record.year
    ) THEN
      applied_results_total := applied_results_total + 1;
    END IF;
    
    -- 스케줄을 재처리 가능하도록 false로 설정 (다음 주차를 위해)
    UPDATE voting_schedules 
    SET is_processed = false, updated_at = current_time
    WHERE id = schedule_record.id;
    
    closed_total := closed_total + 1;
    processed_total := processed_total + 1;
  END LOOP;
  
  RETURN QUERY SELECT processed_total, opened_total, closed_total, applied_results_total;
END;
$$ LANGUAGE plpgsql;

-- 기존 정기 이벤트들에 대한 투표 스케줄 생성 (일회성)
DO $$
DECLARE
  event_record RECORD;
  day_mapping INTEGER[];
  current_week INTEGER;
  current_year INTEGER;
BEGIN
  -- 요일 매핑 (한국어 요일명 -> 숫자)
  day_mapping := ARRAY[0, 1, 2, 3, 4, 5, 6]; -- 일, 월, 화, 수, 목, 금, 토
  
  -- 현재 주차 정보
  current_year := EXTRACT(year FROM NOW());
  current_week := EXTRACT(week FROM NOW());
  
  -- 자동 투표가 활성화된 정기 이벤트들에 대해 스케줄 생성
  FOR event_record IN 
    SELECT id, multi_day, auto_voting_enabled, voting_start_offset_days, voting_duration_days
    FROM multis 
    WHERE event_type = 'regular_schedule' 
      AND auto_voting_enabled = true
  LOOP
    -- multi_day 배열에서 첫 번째 요일 사용 (보통 하나의 요일만 설정됨)
    IF event_record.multi_day IS NOT NULL AND array_length(event_record.multi_day, 1) > 0 THEN
      -- 한국어 요일명을 숫자로 변환
      DECLARE
        day_name TEXT := event_record.multi_day[1];
        day_number INTEGER;
      BEGIN
        CASE day_name
          WHEN '일' THEN day_number := 0;
          WHEN '월' THEN day_number := 1;
          WHEN '화' THEN day_number := 2;
          WHEN '수' THEN day_number := 3;
          WHEN '목' THEN day_number := 4;
          WHEN '금' THEN day_number := 5;
          WHEN '토' THEN day_number := 6;
          ELSE day_number := 1; -- 기본값: 월요일
        END CASE;
        
        -- 현재 주차와 다음 주차에 대한 투표 스케줄 생성
        PERFORM create_voting_schedule_for_week(
          event_record.id,
          current_week,
          current_year,
          day_number,
          '20:30'::time, -- 기본 시작 시간
          COALESCE(event_record.voting_start_offset_days, 1),
          COALESCE(event_record.voting_duration_days, 3)
        );
        
        -- 다음 주차도 생성
        PERFORM create_voting_schedule_for_week(
          event_record.id,
          current_week + 1,
          current_year,
          day_number,
          '20:30'::time,
          COALESCE(event_record.voting_start_offset_days, 1),
          COALESCE(event_record.voting_duration_days, 3)
        );
      END;
    END IF;
  END LOOP;
END $$;
