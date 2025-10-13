-- 사용자 관심 게임 테이블 생성
CREATE TABLE IF NOT EXISTS user_interest_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_interest_games_user_id ON user_interest_games(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interest_games_game_name ON user_interest_games(game_name);

-- RLS 정책 설정
ALTER TABLE user_interest_games ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 관심 게임만 조회/수정 가능
CREATE POLICY "Users can view their own interest games" ON user_interest_games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interest games" ON user_interest_games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interest games" ON user_interest_games
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interest games" ON user_interest_games
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_interest_games_updated_at 
  BEFORE UPDATE ON user_interest_games 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 알림 설정 테이블 (추가 기능)
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flash_event_notifications BOOLEAN DEFAULT true,
  regular_event_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 알림 설정 RLS 정책
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings" ON user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- 알림 설정 업데이트 트리거
CREATE TRIGGER update_user_notification_settings_updated_at 
  BEFORE UPDATE ON user_notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
