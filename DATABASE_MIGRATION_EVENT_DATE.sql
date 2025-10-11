-- 이벤트 날짜 기반 시스템으로 변경
-- multis 테이블에 event_date 컬럼 추가 및 week/year 제거

-- 1. event_date 컬럼 추가
ALTER TABLE public.multis
ADD COLUMN event_date date;

-- 2. 기존 데이터가 있다면 week/year에서 대략적인 날짜로 변환 (옵션)
-- 참고: week는 ISO week number이므로 정확한 변환이 필요할 수 있습니다
-- UPDATE public.multis
-- SET event_date = (date_trunc('year', make_date(year, 1, 1)) + (week - 1) * interval '1 week')::date
-- WHERE year IS NOT NULL AND week IS NOT NULL;

-- 3. 인덱스 추가 (날짜로 필터링할 때 성능 향상)
CREATE INDEX IF NOT EXISTS multis_event_date_idx ON public.multis (event_date);

-- 4. week, year 컬럼 제거 (기존 데이터가 중요하지 않다면)
-- ALTER TABLE public.multis DROP COLUMN week;
-- ALTER TABLE public.multis DROP COLUMN year;

-- 참고: 
-- - event_date를 NOT NULL로 만들려면 기존 데이터를 먼저 업데이트해야 합니다
-- - week/year 컬럼은 기존 데이터가 있다면 천천히 마이그레이션 후 삭제하는 것을 권장합니다

