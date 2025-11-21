-- multis 테이블에 view_count 컬럼 추가
ALTER TABLE multis ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 기존 데이터에 대해 view_count 기본값 설정
UPDATE multis SET view_count = 0 WHERE view_count IS NULL;

-- view_count 컬럼을 NOT NULL로 변경
ALTER TABLE multis ALTER COLUMN view_count SET NOT NULL;
ALTER TABLE multis ALTER COLUMN view_count SET DEFAULT 0;








