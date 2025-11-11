-- iRacing 텔레메트리 데이터 전체 삭제 쿼리
-- ⚠️ 주의: 이 쿼리는 모든 텔레메트리 데이터를 영구적으로 삭제합니다.
-- 테스트 환경에서만 사용하거나, 백업 후 실행하세요.

-- ============================================
-- 방법 1: CASCADE를 이용한 삭제 (가장 간단, 권장)
-- ============================================
-- sessions 테이블만 삭제하면 관련 데이터가 자동으로 삭제됩니다.
-- (iracing_telemetry_controls, iracing_telemetry_vehicle, iracing_telemetry_advanced 모두 자동 삭제)
DELETE FROM iracing_telemetry_sessions;

-- ============================================
-- 방법 2: 각 테이블을 개별적으로 삭제
-- ============================================
-- CASCADE가 제대로 작동하지 않을 경우 사용
-- 순서: 자식 테이블 먼저 삭제, 부모 테이블은 나중에 삭제
/*
DELETE FROM iracing_telemetry_advanced;
DELETE FROM iracing_telemetry_vehicle;
DELETE FROM iracing_telemetry_controls;
DELETE FROM iracing_telemetry_samples; -- 기존 테이블이 있다면
DELETE FROM iracing_telemetry_sessions;
*/

-- ============================================
-- 방법 3: TRUNCATE 사용 (더 빠름)
-- ============================================
-- TRUNCATE는 DELETE보다 빠르지만, CASCADE 제약 조건에 따라 순서가 중요할 수 있습니다.
-- PostgreSQL에서는 CASCADE 옵션을 사용할 수 있습니다.
/*
TRUNCATE TABLE iracing_telemetry_advanced CASCADE;
TRUNCATE TABLE iracing_telemetry_vehicle CASCADE;
TRUNCATE TABLE iracing_telemetry_controls CASCADE;
TRUNCATE TABLE iracing_telemetry_samples CASCADE; -- 기존 테이블이 있다면
TRUNCATE TABLE iracing_telemetry_sessions CASCADE;
*/

-- ============================================
-- 방법 4: 특정 사용자의 데이터만 삭제
-- ============================================
/*
DELETE FROM iracing_telemetry_sessions WHERE user_id = 'USER_ID_HERE';
*/

-- ============================================
-- 방법 5: 특정 기간 이전 데이터 삭제
-- ============================================
/*
DELETE FROM iracing_telemetry_sessions WHERE start_time < '2024-01-01'::timestamp;
*/

-- ============================================
-- 삭제 전 확인 (데이터 개수 확인)
-- ============================================
SELECT 
  'sessions' as table_name, COUNT(*) as count FROM iracing_telemetry_sessions
UNION ALL
SELECT 
  'controls' as table_name, COUNT(*) as count FROM iracing_telemetry_controls
UNION ALL
SELECT 
  'vehicle' as table_name, COUNT(*) as count FROM iracing_telemetry_vehicle
UNION ALL
SELECT 
  'advanced' as table_name, COUNT(*) as count FROM iracing_telemetry_advanced;

-- ============================================
-- 삭제 후 확인 (모든 테이블이 0개여야 함)
-- ============================================
-- 위와 동일한 쿼리로 확인

