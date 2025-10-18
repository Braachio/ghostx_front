-- 게임 카테고리 테이블 생성
-- 기존 String 타입에서 Game 테이블로 변경

-- 1. games 테이블 생성
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT 'bg-gray-600',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 기본 게임 데이터 삽입
INSERT INTO games (name, display_name, icon, color) VALUES
('iracing', 'iRacing', '🏁', 'bg-blue-600'),
('assettocorsa', '아세토코르사', '🏎️', 'bg-green-600'),
('gran-turismo7', '그란투리스모7', '🏁', 'bg-purple-600'),
('competizione', '컴페티치오네', '🏆', 'bg-yellow-600'),
('lemans', '르망얼티밋', '🏎️', 'bg-orange-600'),
('f1-25', 'F1 25', '🏎️', 'bg-red-600'),
('automobilista2', '오토모빌리스타2', '🏎️', 'bg-teal-600'),
('ea-wrc', 'EA WRC', '🌲', 'bg-emerald-600')
ON CONFLICT (name) DO NOTHING;

-- 3. multis 테이블에 game_id 컬럼 추가 (기존 game 컬럼과 병행)
ALTER TABLE multis ADD COLUMN IF NOT EXISTS game_id INTEGER REFERENCES games(id);

-- 4. 기존 game 컬럼 값을 game_id로 마이그레이션
UPDATE multis 
SET game_id = g.id 
FROM games g 
WHERE multis.game = g.name;

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
CREATE INDEX IF NOT EXISTS idx_games_active ON games(is_active);
CREATE INDEX IF NOT EXISTS idx_multis_game_id ON multis(game_id);

-- 6. 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_games_updated_at();

-- 7. RLS 정책 설정
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게임 목록을 읽을 수 있도록 허용
CREATE POLICY "게임 목록 조회 허용" ON games
  FOR SELECT USING (is_active = true);

-- 관리자만 게임을 생성/수정/삭제할 수 있도록 제한
CREATE POLICY "관리자만 게임 관리" ON games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'event_manager')
    )
  );
