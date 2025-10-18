-- 알림 설정 테이블 수정
-- unique 제약 조건 문제 해결

-- 1. 기존 unique 제약 조건 제거 (있다면)
ALTER TABLE user_notification_settings DROP CONSTRAINT IF EXISTS user_notification_settings_user_id_key;

-- 2. user_id에 대한 unique 제약 조건을 복합 키로 변경
-- 또는 완전히 제거하고 1:N 관계로 변경
ALTER TABLE user_notification_settings DROP CONSTRAINT IF EXISTS user_notification_settings_pkey;

-- 3. 새로운 primary key 추가 (id 필드)
ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- 4. user_id + notification_type 복합 unique 제약 조건 추가 (1:N 관계 지원)
-- 또는 단순히 user_id만 unique로 유지 (1:1 관계)
ALTER TABLE user_notification_settings ADD CONSTRAINT user_notification_settings_user_id_unique 
UNIQUE (user_id);

-- 5. 기존 데이터 정리 (중복 제거)
WITH duplicates AS (
  SELECT user_id, MIN(id) as keep_id
  FROM user_notification_settings
  GROUP BY user_id
  HAVING COUNT(*) > 1
)
DELETE FROM user_notification_settings 
WHERE id NOT IN (SELECT keep_id FROM duplicates)
AND user_id IN (SELECT user_id FROM duplicates);

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id 
ON user_notification_settings(user_id);

-- 7. RLS 정책 설정
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 설정만 조회/수정 가능
CREATE POLICY "사용자 알림 설정 접근" ON user_notification_settings
  FOR ALL USING (auth.uid() = user_id);

-- 8. 업데이트 트리거 추가
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();
