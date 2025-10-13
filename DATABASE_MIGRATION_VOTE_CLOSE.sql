-- 투표 종료 기능을 위한 컬럼 추가
-- regular_event_vote_options 테이블에 voting_closed 컬럼 추가
ALTER TABLE regular_event_vote_options 
ADD COLUMN IF NOT EXISTS voting_closed BOOLEAN DEFAULT false;

-- 투표 종료 컬럼에 대한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_vote_options_voting_closed 
ON regular_event_vote_options(regular_event_id, week_number, year, voting_closed);

-- 투표 종료 상태를 조회하는 뷰 생성 (편의성)
CREATE OR REPLACE VIEW voting_status AS
SELECT 
  regular_event_id,
  week_number,
  year,
  option_type,
  voting_closed
FROM regular_event_vote_options
GROUP BY regular_event_id, week_number, year, option_type, voting_closed;

-- 투표 종료/재개를 위한 함수 생성
CREATE OR REPLACE FUNCTION toggle_voting_status(
  p_regular_event_id UUID,
  p_week_number INTEGER,
  p_year INTEGER,
  p_voting_closed BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 해당 주차의 모든 투표 옵션의 voting_closed 상태 업데이트
  UPDATE regular_event_vote_options 
  SET voting_closed = p_voting_closed
  WHERE regular_event_id = p_regular_event_id 
    AND week_number = p_week_number 
    AND year = p_year;
    
  -- 업데이트된 행이 있는지 확인
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 투표 종료 시 투표를 차단하는 트리거 함수
CREATE OR REPLACE FUNCTION check_voting_closed()
RETURNS TRIGGER AS $$
BEGIN
  -- 투표가 종료되었는지 확인
  IF EXISTS (
    SELECT 1 FROM regular_event_vote_options 
    WHERE regular_event_id = NEW.regular_event_id 
      AND week_number = NEW.week_number 
      AND year = NEW.year 
      AND voting_closed = true
  ) THEN
    RAISE EXCEPTION '투표가 종료되어 더 이상 투표할 수 없습니다.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 투표 종료 확인 트리거 생성
CREATE TRIGGER trigger_check_voting_closed
  BEFORE INSERT OR UPDATE ON regular_event_votes
  FOR EACH ROW EXECUTE FUNCTION check_voting_closed();

-- RLS 정책 업데이트 (투표 종료 상태 수정은 이벤트 작성자만)
CREATE POLICY "Event creators can update voting status" ON regular_event_vote_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = regular_event_vote_options.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );
