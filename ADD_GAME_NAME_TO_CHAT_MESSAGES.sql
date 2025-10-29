-- 게임별 채팅을 위한 game_name 컬럼 추가
ALTER TABLE event_chat_messages 
ADD COLUMN IF NOT EXISTS game_name VARCHAR(50);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_game_name ON event_chat_messages(game_name);

-- event_id와 game_name 중 하나는 반드시 있어야 함
-- (event_id는 이벤트별 채팅, game_name은 게임별 채팅)

