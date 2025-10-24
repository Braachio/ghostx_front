# 갤로그 API 연동 설정 가이드

## 🔧 환경 변수 설정

갤로그 API 연동을 위해 다음 환경 변수를 설정해야 합니다:

```bash
# .env.local 파일에 추가
DCINSIDE_SESSION_COOKIE=your_dcinside_session_cookie_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📋 갤로그 API 연동 단계

### 1. DCinside 세션 쿠키 획득

1. **DCinside 로그인**
   - DCinside 웹사이트에 로그인
   - 개발자 도구 (F12) → Network 탭 열기
   - 갤로그 방명록 작성 시도
   - 요청 헤더에서 `Cookie` 값 복사

2. **세션 쿠키 추출**
   ```
   예시: dcinside_session=abc123; user_id=456789; login_token=xyz789
   ```

### 2. 갤로그 API 테스트

1. **관리자 페이지 접속**
   ```
   http://localhost:3000/admin/gallog-test
   ```

2. **테스트 닉네임 입력**
   - 실제 갤로그 닉네임 입력
   - "갤로그 API 테스트" 버튼 클릭

3. **결과 확인**
   - 성공: 갤로그 방명록에 테스트 메시지 전송됨
   - 실패: API 구조 재검토 필요

### 3. 실제 갤로그 API 구조 분석

갤로그 방명록 작성 시 사용되는 실제 API:

```typescript
// 갤로그 방명록 작성 API
POST https://gall.dcinside.com/board/visit

// 요청 데이터
{
  id: 'simracing',           // 갤러리 ID
  no: 'target_nickname',     // 대상 닉네임
  comment: 'message',        // 방명록 내용
  password: '1234',          // 방명록 비밀번호
  secret: '1',               // 비밀글 여부
  mode: 'write'             // 작성 모드
}

// 응답 확인
- 200 OK: 성공
- 403 Forbidden: 권한 없음
- 400 Bad Request: 잘못된 요청
```

## 🚨 주의사항

### 1. API 제한사항
- **Rate Limiting**: 너무 많은 요청 시 차단될 수 있음
- **인증 필요**: 유효한 DCinside 세션 쿠키 필요
- **갤러리 권한**: 해당 갤러리에서 방명록 작성 권한 필요

### 2. 보안 고려사항
- **세션 쿠키 보안**: 환경 변수로 안전하게 관리
- **API 키 보호**: 서버 사이드에서만 사용
- **사용자 정보 보호**: 갤로그 닉네임과 인증 코드만 전송

### 3. 법적 고려사항
- **이용약관 준수**: DCinside 이용약관 확인
- **자동화 제한**: 과도한 자동화 방지
- **스팸 방지**: 적절한 간격으로 요청 전송

## 🔍 문제 해결

### 1. API 호출 실패
```bash
# 로그 확인
console.log('갤로그 API 응답:', response.status, response.statusText)

# 세션 쿠키 확인
console.log('세션 쿠키:', process.env.DCINSIDE_SESSION_COOKIE)
```

### 2. 인증 오류
- DCinside 세션 만료 확인
- 갤러리 접근 권한 확인
- 방명록 작성 권한 확인

### 3. 네트워크 오류
- CORS 정책 확인
- 프록시 설정 확인
- 방화벽 설정 확인

## 📊 모니터링

### 1. 성공률 추적
```typescript
// 갤로그 API 성공률 모니터링
const successRate = (successfulRequests / totalRequests) * 100
```

### 2. 오류 로그
```typescript
// 갤로그 API 오류 로그
console.error('갤로그 API 오류:', {
  nickname: targetNickname,
  error: error.message,
  timestamp: new Date().toISOString()
})
```

## 🎯 최적화 방안

### 1. 배치 처리
- 여러 인증 코드를 한 번에 전송
- API 호출 횟수 최소화

### 2. 캐싱
- 갤로그 닉네임 검증 결과 캐싱
- 인증 코드 만료 시간 관리

### 3. 재시도 로직
- 실패 시 자동 재시도
- 지수 백오프 적용

---

**참고**: 갤로그 API는 DCinside의 비공식 API이므로, 정책 변경 시 동작하지 않을 수 있습니다. 정기적인 테스트와 모니터링이 필요합니다.
