-- 참가자 테이블 생성
CREATE TABLE IF NOT EXISTS multi_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  multi_id UUID REFERENCES multis(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(multi_id, user_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_multi_participants_multi_id ON multi_participants(multi_id);
CREATE INDEX IF NOT EXISTS idx_multi_participants_user_id ON multi_participants(user_id);

-- RLS 정책 추가
ALTER TABLE multi_participants ENABLE ROW LEVEL SECURITY;

-- 참가자 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view participants" ON multi_participants
  FOR SELECT USING (true);

-- 참가신청 정책 (로그인한 사용자만)
CREATE POLICY "Authenticated users can join events" ON multi_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 참가취소 정책 (본인만)
CREATE POLICY "Users can leave events" ON multi_participants
  FOR DELETE USING (auth.uid() = user_id);

-- 참가자 수 업데이트를 위한 함수
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 참가자 추가 시
  IF TG_OP = 'INSERT' THEN
    -- multis 테이블에 participant_count 컬럼이 있다면 업데이트
    -- (현재는 multis 테이블에 해당 컬럼이 없으므로 주석 처리)
    -- UPDATE multis SET participant_count = participant_count + 1 WHERE id = NEW.multi_id;
    RETURN NEW;
  END IF;
  
  -- 참가자 제거 시
  IF TG_OP = 'DELETE' THEN
    -- multis 테이블에 participant_count 컬럼이 있다면 업데이트
    -- (현재는 multis 테이블에 해당 컬럼이 없으므로 주석 처리)
    -- UPDATE multis SET participant_count = participant_count - 1 WHERE id = OLD.multi_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_update_participant_count
  AFTER INSERT OR DELETE ON multi_participants
  FOR EACH ROW EXECUTE FUNCTION update_participant_count();
