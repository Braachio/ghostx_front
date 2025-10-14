
-- 기존 테이블 삭제 (있다면)
DROP TABLE IF EXISTS regular_multi_track_history CASCADE;
DROP TABLE IF EXISTS track_name_mapping CASCADE;

-- 트랙 명 매핑 테이블 생성
CREATE TABLE track_name_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  standardized_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_name, original_name)
);

-- 인덱스 생성
CREATE INDEX idx_track_name_mapping_game ON track_name_mapping(game_name);
CREATE INDEX idx_track_name_mapping_standardized ON track_name_mapping(standardized_name);

-- RLS 정책
ALTER TABLE track_name_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view track mappings" ON track_name_mapping;
CREATE POLICY "Anyone can view track mappings" ON track_name_mapping
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage track mappings" ON track_name_mapping;
CREATE POLICY "Authenticated users can manage track mappings" ON track_name_mapping
  FOR ALL USING (auth.role() = 'authenticated');

-- 정기 멀티 트랙 히스토리 테이블 생성
CREATE TABLE regular_multi_track_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  regular_event_id UUID REFERENCES multis(id),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  selected_track TEXT NOT NULL,
  selected_car_class TEXT NOT NULL,
  game_name TEXT NOT NULL,
  standardized_track_name TEXT NOT NULL, -- 획일화된 트랙 명
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_regular_multi_track_history_week_year ON regular_multi_track_history(year, week_number);
CREATE INDEX idx_regular_multi_track_history_track ON regular_multi_track_history(standardized_track_name);
CREATE INDEX idx_regular_multi_track_history_event ON regular_multi_track_history(regular_event_id);
CREATE INDEX idx_regular_multi_track_history_game ON regular_multi_track_history(game_name);

-- RLS 정책
ALTER TABLE regular_multi_track_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view track history" ON regular_multi_track_history;
CREATE POLICY "Anyone can view track history" ON regular_multi_track_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Event creators can manage track history" ON regular_multi_track_history;
CREATE POLICY "Event creators can manage track history" ON regular_multi_track_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM multis 
      WHERE multis.id = regular_multi_track_history.regular_event_id 
      AND multis.author_id = auth.uid()
    )
  );

-- 기본 트랙 명 매핑 데이터 삽입 (주요 레이싱 게임)
INSERT INTO track_name_mapping (game_name, original_name, standardized_name) VALUES
-- 아이레이싱 (iRacing)
('아이레이싱', 'Spa-Francorchamps', '스파-프랑코샹'),
('아이레이싱', 'Spa', '스파-프랑코샹'),
('아이레이싱', 'Monza', '몬자'),
('아이레이싱', 'Silverstone', '실버스톤'),
('아이레이싱', 'Nürburgring', '뉘르부르크링'),
('아이레이싱', 'Sebring', '세브링'),
('아이레이싱', 'Watkins Glen', '왓킨스 글렌'),
('아이레이싱', 'Road America', '로드 아메리카'),
('아이레이싱', 'Laguna Seca', '라구나 세카'),
('아이레이싱', 'Circuit of the Americas', 'COTA'),

-- 아세토코르사 컴페티치오네 (ACC)
('아세토코르사 컴페티치오네', 'Spa-Francorchamps', '스파-프랑코샹'),
('아세토코르사 컴페티치오네', 'Monza', '몬자'),
('아세토코르사 컴페티치오네', 'Silverstone', '실버스톤'),
('아세토코르사 컴페티치오네', 'Nürburgring', '뉘르부르크링'),
('아세토코르사 컴페티치오네', 'Imola', '이몰라'),
('아세토코르사 컴페티치오네', 'Barcelona', '바르셀로나'),
('아세토코르사 컴페티치오네', 'Misano', '미사노'),
('아세토코르사 컴페티치오네', 'Zandvoort', '잔드보르트'),
('아세토코르사 컴페티치오네', 'Kyalami', '키얄라미'),
('아세토코르사 컴페티치오네', 'Suzuka', '스즈카'),

-- 르망 얼티밋 (Le Mans Ultimate)
('르망 얼티밋', 'Circuit de la Sarthe', '라 사르트'),
('르망 얼티밋', 'Le Mans', '라 사르트'),
('르망 얼티밋', 'Spa-Francorchamps', '스파-프랑코샹'),
('르망 얼티밋', 'Monza', '몬자'),
('르망 얼티밋', 'Silverstone', '실버스톤'),
('르망 얼티밋', 'Nürburgring', '뉘르부르크링'),
('르망 얼티밋', 'Sebring', '세브링'),
('르망 얼티밋', 'Portimão', '포르티망'),
('르망 얼티밋', 'Bahrain', '바레인'),
('르망 얼티밋', 'Kyalami', '키얄라미'),

-- F1 25
('F1 25', 'Spa-Francorchamps', '스파-프랑코샹'),
('F1 25', 'Monza', '몬자'),
('F1 25', 'Silverstone', '실버스톤'),
('F1 25', 'Monaco', '모나코'),
('F1 25', 'Circuit of the Americas', 'COTA'),
('F1 25', 'Suzuka', '스즈카'),
('F1 25', 'Bahrain', '바레인'),
('F1 25', 'Abu Dhabi', '아부다비'),
('F1 25', 'Barcelona', '바르셀로나'),
('F1 25', 'Imola', '이몰라');

-- 트랙 명 매핑 업데이트 함수
DROP FUNCTION IF EXISTS get_standardized_track_name(TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_standardized_track_name(
  p_game_name TEXT,
  p_original_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  standardized_name TEXT;
BEGIN
  -- 매핑 테이블에서 표준화된 이름 찾기
  SELECT tnm.standardized_name INTO standardized_name
  FROM track_name_mapping tnm
  WHERE tnm.game_name = p_game_name
    AND tnm.original_name = p_original_name;
  
  -- 매핑이 없으면 원본 이름 반환
  IF standardized_name IS NULL THEN
    standardized_name := p_original_name;
  END IF;
  
  RETURN standardized_name;
END;
$$ LANGUAGE plpgsql;
