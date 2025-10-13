-- 정기 이벤트 주차별 설정 테이블
CREATE TABLE IF NOT EXISTS regular_event_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_event_id UUID REFERENCES multis(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL, -- 몇 번째 주차인지
  year INTEGER NOT NULL,
  track VARCHAR(255) NOT NULL,
  car_class VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  duration_hours DECIMAL(3,1) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 정기 이벤트 투표 테이블
CREATE TABLE IF NOT EXISTS regular_event_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_event_id UUID REFERENCES multis(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  track_option VARCHAR(255) NOT NULL,
  car_class_option VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(regular_event_id, week_number, year, voter_id)
);

-- 투표 옵션 테이블 (트랙과 차량 클래스 후보들)
CREATE TABLE IF NOT EXISTS regular_event_vote_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_event_id UUID REFERENCES multis(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  option_type VARCHAR(20) NOT NULL CHECK (option_type IN ('track', 'car_class')),
  option_value VARCHAR(255) NOT NULL,
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(regular_event_id, week_number, year, option_type, option_value)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_regular_event_schedules_event_id ON regular_event_schedules(regular_event_id);
CREATE INDEX IF NOT EXISTS idx_regular_event_schedules_week ON regular_event_schedules(regular_event_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_regular_event_votes_event_week ON regular_event_votes(regular_event_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_regular_event_vote_options_event_week ON regular_event_vote_options(regular_event_id, year, week_number);

-- RLS 정책 추가
ALTER TABLE regular_event_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE regular_event_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE regular_event_vote_options ENABLE ROW LEVEL SECURITY;

-- 정기 이벤트 스케줄 조회 정책
CREATE POLICY "Anyone can view regular event schedules" ON regular_event_schedules
  FOR SELECT USING (true);

-- 정기 이벤트 스케줄 생성 정책 (이벤트 작성자만)
CREATE POLICY "Event creators can insert regular event schedules" ON regular_event_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = regular_event_schedules.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );

-- 정기 이벤트 스케줄 수정 정책 (이벤트 작성자만)
CREATE POLICY "Event creators can update regular event schedules" ON regular_event_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = regular_event_schedules.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );

-- 투표 조회 정책
CREATE POLICY "Anyone can view votes" ON regular_event_votes
  FOR SELECT USING (true);

-- 투표 생성 정책 (로그인한 사용자만)
CREATE POLICY "Authenticated users can vote" ON regular_event_votes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 투표 수정 정책 (본인 투표만)
CREATE POLICY "Users can update their own votes" ON regular_event_votes
  FOR UPDATE USING (voter_id = auth.uid());

-- 투표 옵션 조회 정책
CREATE POLICY "Anyone can view vote options" ON regular_event_vote_options
  FOR SELECT USING (true);

-- 투표 옵션 생성 정책 (이벤트 작성자만)
CREATE POLICY "Event creators can insert vote options" ON regular_event_vote_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = regular_event_vote_options.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );

-- 투표 옵션 수정 정책 (이벤트 작성자만)
CREATE POLICY "Event creators can update vote options" ON regular_event_vote_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = regular_event_vote_options.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );

-- 트리거 함수: 투표 시 투표 수 업데이트
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- 투표 삽입 시
  IF TG_OP = 'INSERT' THEN
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count + 1
    WHERE regular_event_id = NEW.regular_event_id 
      AND week_number = NEW.week_number 
      AND year = NEW.year
      AND option_type = 'track' 
      AND option_value = NEW.track_option;
      
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count + 1
    WHERE regular_event_id = NEW.regular_event_id 
      AND week_number = NEW.week_number 
      AND year = NEW.year
      AND option_type = 'car_class' 
      AND option_value = NEW.car_class_option;
      
    RETURN NEW;
  END IF;
  
  -- 투표 수정 시
  IF TG_OP = 'UPDATE' THEN
    -- 이전 투표에서 감소
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count - 1
    WHERE regular_event_id = OLD.regular_event_id 
      AND week_number = OLD.week_number 
      AND year = OLD.year
      AND option_type = 'track' 
      AND option_value = OLD.track_option;
      
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count - 1
    WHERE regular_event_id = OLD.regular_event_id 
      AND week_number = OLD.week_number 
      AND year = OLD.year
      AND option_type = 'car_class' 
      AND option_value = OLD.car_class_option;
    
    -- 새로운 투표에서 증가
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count + 1
    WHERE regular_event_id = NEW.regular_event_id 
      AND week_number = NEW.week_number 
      AND year = NEW.year
      AND option_type = 'track' 
      AND option_value = NEW.track_option;
      
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count + 1
    WHERE regular_event_id = NEW.regular_event_id 
      AND week_number = NEW.week_number 
      AND year = NEW.year
      AND option_type = 'car_class' 
      AND option_value = NEW.car_class_option;
      
    RETURN NEW;
  END IF;
  
  -- 투표 삭제 시
  IF TG_OP = 'DELETE' THEN
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count - 1
    WHERE regular_event_id = OLD.regular_event_id 
      AND week_number = OLD.week_number 
      AND year = OLD.year
      AND option_type = 'track' 
      AND option_value = OLD.track_option;
      
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count - 1
    WHERE regular_event_id = OLD.regular_event_id 
      AND week_number = OLD.week_number 
      AND year = OLD.year
      AND option_type = 'car_class' 
      AND option_value = OLD.car_class_option;
      
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON regular_event_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_counts();
