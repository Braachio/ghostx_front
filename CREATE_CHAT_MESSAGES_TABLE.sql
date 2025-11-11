-- 채팅 메시지 테이블 생성
CREATE TABLE IF NOT EXISTS event_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES multis(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  color VARCHAR(20) DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_event_id ON event_chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_created_at ON event_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_user_id ON event_chat_messages(user_id);

-- RLS 정책 설정
ALTER TABLE event_chat_messages ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 채팅 메시지를 읽을 수 있도록 허용
CREATE POLICY "Anyone can view chat messages" ON event_chat_messages
  FOR SELECT USING (true);

-- 로그인한 사용자만 채팅 메시지를 작성할 수 있도록 허용
CREATE POLICY "Authenticated users can send chat messages" ON event_chat_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 작성자만 자신의 메시지를 수정/삭제할 수 있도록 허용
CREATE POLICY "Users can update their own messages" ON event_chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON event_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON event_chat_messages;
CREATE TRIGGER trigger_update_chat_messages_updated_at
    BEFORE UPDATE ON event_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_messages_updated_at();

-- 메시지 정리 함수 (오래된 메시지 자동 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void AS $$
BEGIN
    -- 30일 이상 된 메시지 삭제
    DELETE FROM event_chat_messages 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 정리 함수를 주기적으로 실행하는 스케줄 (선택사항)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-chat-messages', '0 2 * * *', 'SELECT cleanup_old_chat_messages();');



