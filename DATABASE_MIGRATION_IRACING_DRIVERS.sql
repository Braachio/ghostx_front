-- iRacing 드라이버 설정 및 즐겨찾기 테이블 생성

-- 1. profiles 테이블에 주요 드라이버 필드 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS main_driver_cust_id INTEGER;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_main_driver_cust_id 
ON profiles(main_driver_cust_id);

-- 2. 즐겨찾기 드라이버 테이블 생성
CREATE TABLE IF NOT EXISTS iracing_favorite_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cust_id INTEGER NOT NULL,
  driver_name TEXT,
  notes TEXT, -- 사용자 메모 (예: "잘하는 사람", "자주 보는 사람" 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cust_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_iracing_favorite_drivers_user_id 
ON iracing_favorite_drivers(user_id);

CREATE INDEX IF NOT EXISTS idx_iracing_favorite_drivers_cust_id 
ON iracing_favorite_drivers(cust_id);

-- RLS 정책 설정
ALTER TABLE iracing_favorite_drivers ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 즐겨찾기만 조회/수정 가능
CREATE POLICY "Users can view their own favorite drivers" ON iracing_favorite_drivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite drivers" ON iracing_favorite_drivers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite drivers" ON iracing_favorite_drivers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite drivers" ON iracing_favorite_drivers
  FOR DELETE USING (auth.uid() = user_id);

-- 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_iracing_favorite_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_iracing_favorite_drivers_updated_at 
  BEFORE UPDATE ON iracing_favorite_drivers 
  FOR EACH ROW EXECUTE FUNCTION update_iracing_favorite_drivers_updated_at();

