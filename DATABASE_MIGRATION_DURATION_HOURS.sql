-- multis 테이블에 duration_hours 컬럼 추가
ALTER TABLE multis ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(3,1);

-- duration_hours 컬럼에 기본값 설정 (기존 데이터용)
UPDATE multis SET duration_hours = 2.0 WHERE duration_hours IS NULL;

-- duration_hours 컬럼을 NOT NULL로 변경
ALTER TABLE multis ALTER COLUMN duration_hours SET NOT NULL;
ALTER TABLE multis ALTER COLUMN duration_hours SET DEFAULT 2.0;
