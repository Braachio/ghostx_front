-- 투표 테이블 생성
CREATE TABLE IF NOT EXISTS regular_event_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_event_id UUID NOT NULL REFERENCES multis(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_option_id UUID NOT NULL REFERENCES regular_event_vote_options(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(regular_event_id, user_id, week_number, year) -- 사용자는 주차당 한 번만 투표 가능
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_regular_event_votes_event_user ON regular_event_votes(regular_event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_regular_event_votes_week_year ON regular_event_votes(week_number, year);
CREATE INDEX IF NOT EXISTS idx_regular_event_votes_option ON regular_event_votes(vote_option_id);

-- RLS 정책 설정
ALTER TABLE regular_event_votes ENABLE ROW LEVEL SECURITY;

-- 투표 조회 정책 (모든 사용자가 투표 결과 확인 가능)
CREATE POLICY "Anyone can view votes" ON regular_event_votes
  FOR SELECT USING (true);

-- 투표 생성 정책 (로그인한 사용자만 투표 가능)
CREATE POLICY "Authenticated users can vote" ON regular_event_votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM regular_event_vote_options 
      WHERE id = vote_option_id 
      AND regular_event_id = regular_event_votes.regular_event_id
      AND voting_closed = false -- 투표가 종료되지 않은 경우만
    )
  );

-- 투표 수정 정책 (자신의 투표만 수정 가능)
CREATE POLICY "Users can update their own votes" ON regular_event_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- 투표 삭제 정책 (자신의 투표만 삭제 가능)
CREATE POLICY "Users can delete their own votes" ON regular_event_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 투표 수 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 투표 옵션의 투표 수 업데이트
  IF TG_OP = 'INSERT' THEN
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.vote_option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE regular_event_vote_options 
    SET votes_count = votes_count - 1 
    WHERE id = OLD.vote_option_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- 투표 옵션이 변경된 경우
    IF OLD.vote_option_id != NEW.vote_option_id THEN
      UPDATE regular_event_vote_options 
      SET votes_count = votes_count - 1 
      WHERE id = OLD.vote_option_id;
      
      UPDATE regular_event_vote_options 
      SET votes_count = votes_count + 1 
      WHERE id = NEW.vote_option_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 투표 수 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_vote_count ON regular_event_votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR UPDATE OR DELETE ON regular_event_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- 투표 종료 상태 확인 함수 (투표 종료 시 새 투표 방지)
CREATE OR REPLACE FUNCTION check_voting_closed()
RETURNS TRIGGER AS $$
BEGIN
  -- 투표가 종료되었는지 확인
  IF EXISTS (
    SELECT 1 FROM regular_event_vote_options 
    WHERE id = NEW.vote_option_id 
      AND voting_closed = true
  ) THEN
    RAISE EXCEPTION '투표가 종료되어 더 이상 투표할 수 없습니다.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 투표 종료 상태 확인 트리거
DROP TRIGGER IF EXISTS trigger_check_voting_closed ON regular_event_votes;
CREATE TRIGGER trigger_check_voting_closed
  BEFORE INSERT OR UPDATE ON regular_event_votes
  FOR EACH ROW EXECUTE FUNCTION check_voting_closed();
