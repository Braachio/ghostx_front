-- 투표 옵션 테이블 생성 (간단 버전)
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
CREATE INDEX IF NOT EXISTS idx_regular_event_vote_options_event_week 
ON regular_event_vote_options(regular_event_id, year, week_number);

-- RLS 정책 추가
ALTER TABLE regular_event_vote_options ENABLE ROW LEVEL SECURITY;

-- 투표 옵션 조회 정책 (모든 사용자)
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
