-- 참가자 테이블 구조 수정 및 RLS 정책 추가

-- 1. participants 테이블이 존재하는지 확인하고 필요한 컬럼 추가
DO $$ 
BEGIN
    -- participants 테이블이 존재하는지 확인
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'participants') THEN
        -- status 컬럼이 없으면 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'status') THEN
            ALTER TABLE participants ADD COLUMN status VARCHAR(20) DEFAULT 'confirmed';
        END IF;
        
        -- nickname 컬럼이 없으면 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'nickname') THEN
            ALTER TABLE participants ADD COLUMN nickname VARCHAR(50) DEFAULT '익명';
        END IF;
        
        -- event_id 컬럼이 없으면 추가 (multi_id 대신)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'event_id') THEN
            ALTER TABLE participants ADD COLUMN event_id UUID;
            -- 기존 multi_id가 있다면 event_id로 복사
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'multi_id') THEN
                UPDATE participants SET event_id = multi_id WHERE event_id IS NULL;
            END IF;
        END IF;
        
        -- updated_at 컬럼이 없으면 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'updated_at') THEN
            ALTER TABLE participants ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        RAISE NOTICE 'participants 테이블 구조 업데이트 완료';
    ELSE
        -- participants 테이블이 없으면 생성
        CREATE TABLE participants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID REFERENCES multis(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            nickname VARCHAR(50) DEFAULT '익명',
            status VARCHAR(20) DEFAULT 'confirmed',
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(event_id, user_id)
        );
        
        RAISE NOTICE 'participants 테이블 생성 완료';
    END IF;
END $$;

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- 3. RLS 활성화
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- 4. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Anyone can view participants" ON participants;
DROP POLICY IF EXISTS "Authenticated users can join events" ON participants;
DROP POLICY IF EXISTS "Users can leave events" ON participants;
DROP POLICY IF EXISTS "Event managers can update participant status" ON participants;

-- 5. 새로운 RLS 정책 추가
-- 참가자 조회 정책 (모든 사용자)
CREATE POLICY "Anyone can view participants" ON participants
  FOR SELECT USING (true);

-- 참가신청 정책 (로그인한 사용자만)
CREATE POLICY "Authenticated users can join events" ON participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 참가취소 정책 (본인만)
CREATE POLICY "Users can leave events" ON participants
  FOR DELETE USING (auth.uid() = user_id);

-- 참가자 상태 업데이트 정책 (이벤트 작성자 또는 관리자만)
CREATE POLICY "Event managers can update participant status" ON participants
  FOR UPDATE USING (
    -- 이벤트 작성자인 경우
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = participants.event_id 
      AND multis.author_id = auth.uid()
    )
    OR
    -- 관리자인 경우
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'event_manager')
    )
  );

-- 6. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_participants_updated_at ON participants;
CREATE TRIGGER trigger_update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participants_updated_at();

