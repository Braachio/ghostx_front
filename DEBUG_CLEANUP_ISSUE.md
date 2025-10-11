# 🐛 Cleanup API 디버깅 가이드

## 문제 상황
- API에서 "정리 완료" 메시지 반환
- `updatedCount: 6` 표시
- 하지만 실제 데이터베이스에서 `is_open` 값이 `TRUE`에서 변경되지 않음

## 가능한 원인들

### 1. **RLS (Row Level Security) 문제**
Supabase에서 `multis` 테이블에 RLS가 활성화되어 있고, 현재 사용자가 UPDATE 권한이 없을 수 있습니다.

**해결 방법:**
```sql
-- RLS 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'multis';

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'multis';

-- 임시로 RLS 비활성화 (테스트용)
ALTER TABLE multis DISABLE ROW LEVEL SECURITY;

-- 또는 UPDATE 정책 추가
CREATE POLICY "Allow authenticated users to update multis" ON multis
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
```

### 2. **Service Role Key 사용**
현재 코드는 사용자 인증을 사용하고 있는데, 관리자 작업은 Service Role Key를 사용해야 할 수 있습니다.

### 3. **데이터베이스 연결 문제**
Supabase 클라이언트가 올바른 권한으로 연결되지 않았을 수 있습니다.

## 디버깅 단계

### 1. **로그 확인**
브라우저 개발자 도구 → Network 탭에서 `/api/multis/cleanup` 요청의 응답을 확인

### 2. **Supabase 로그 확인**
Supabase Dashboard → Logs → API Logs에서 UPDATE 쿼리 실행 여부 확인

### 3. **직접 SQL 테스트**
Supabase Dashboard → SQL Editor에서 직접 UPDATE 쿼리 실행:
```sql
UPDATE multis 
SET is_open = false 
WHERE id IN ('5af6e8c2-9fcc-4d91-8f4d-677baa9df26c', 'a4d6f606-b309-471a-9bbe-a9166acff6b2');
```

### 4. **권한 테스트**
```sql
-- 현재 사용자 권한 확인
SELECT current_user, session_user;

-- multis 테이블 권한 확인
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'multis';
```
