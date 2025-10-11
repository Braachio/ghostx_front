# Steam 로그인 디버깅 가이드

## 현재 상황
- Steam 로그인에서 "회원가입 실패" 에러 발생
- 익명 로그인 활성화 후 문제 발생

## 해결 단계

### 1. Supabase Auth 설정 확인
```
Authentication → Settings → User Signups
❌ Allow anonymous sign-ins: 임시로 비활성화
✅ Confirm email: 비활성화 (이미 설정됨)
```

### 2. 테스트 순서
1. 익명 로그인 비활성화
2. Steam 로그인 테스트
3. 성공하면 익명 로그인 다시 활성화
4. 충돌 테스트

### 3. 가능한 원인들
- 익명 로그인과 Steam 로그인 세션 충돌
- Supabase Auth 설정 충돌
- 이메일 형식 문제
- 데이터베이스 마이그레이션 미완료

### 4. 디버깅 방법
- Vercel 로그에서 상세 에러 확인
- 브라우저 개발자 도구 Network 탭 확인
- Supabase 대시보드에서 Auth 로그 확인

## 현재 수정사항
- Steam callback 로직 단순화
- 상세한 에러 로깅 추가
- upsert를 사용한 안전한 프로필 처리
