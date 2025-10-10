-- Steam 연동을 위한 컬럼 추가
-- Supabase 대시보드 → SQL Editor에서 실행하세요

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS steam_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS steam_avatar TEXT;

-- Steam ID 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_steam_id ON profiles(steam_id);

-- Steam 사용자를 위한 이메일 확인 자동 처리
-- (Steam OAuth는 이메일 확인이 불필요)

