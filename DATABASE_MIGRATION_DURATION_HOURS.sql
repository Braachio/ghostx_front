-- multis 테이블에 duration_hours 컬럼 추가
ALTER TABLE multis ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(3,1);

-- multis 테이블에 max_participants 컬럼 추가
ALTER TABLE multis ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- duration_hours 컬럼에 기본값 설정 (기존 데이터용)
UPDATE multis SET duration_hours = 2.0 WHERE duration_hours IS NULL;

-- max_participants 컬럼에 기본값 설정 (기존 데이터용)
UPDATE multis SET max_participants = 20 WHERE max_participants IS NULL;

-- duration_hours 컬럼을 NOT NULL로 변경
ALTER TABLE multis ALTER COLUMN duration_hours SET NOT NULL;
ALTER TABLE multis ALTER COLUMN duration_hours SET DEFAULT 2.0;

-- max_participants 컬럼을 NOT NULL로 변경
ALTER TABLE multis ALTER COLUMN max_participants SET NOT NULL;
ALTER TABLE multis ALTER COLUMN max_participants SET DEFAULT 20;
