# iRacing API 실제 데이터 연동 설정 가이드

## ⚠️ 필수 사전 준비

### 레거시 인증 활성화 (Legacy Authentication)

iRacing API를 사용하려면 **레거시 인증을 활성화**해야 합니다:

1. iRacing 계정 관리 페이지로 이동: https://oauth.iracing.com/accountmanagement/
2. **Security** 섹션으로 이동
3. **"Enable Legacy Authentication"** 버튼 클릭
4. 확인 대화상자에서 확인

⚠️ **중요**: 
- 레거시 인증을 활성화하지 않으면 `authcode: 0` 및 "Authentication failure" 오류가 발생합니다.
- 2FA(Two-Factor Authentication)가 활성화된 경우에도 레거시 인증을 활성화해야 API 접근이 가능합니다.
- 레거시 인증은 읽기 전용 API 접근을 위한 것이며, 계정 보안에는 영향을 주지 않습니다.

## 🚀 빠른 시작 (3단계)

### 1단계: 환경 변수 파일 생성

`ghostx_front` 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
IRACING_EMAIL=당신의_iRacing_이메일
IRACING_PASSWORD="당신의_iRacing_비밀번호"
```

⚠️ **주의사항**:
- `.env.local` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함됨)
- 비밀번호에 특수문자(`#`, `@`, `%` 등)가 포함된 경우 **따옴표로 감싸야** 합니다

### 2단계: 개발 서버 재시작

환경 변수를 설정한 후 개발 서버를 재시작하세요:

```bash
# 개발 서버 중지 (Ctrl+C)
# 그리고 다시 시작
npm run dev
```

### 3단계: 테스트

브라우저에서 iRacing Insights 페이지 (`/iracing`)를 열고:
- 드라이버 검색 기능 테스트
- 세션 ID 입력하여 세션 요약 확인

---

## 상세 설정 가이드

### 2. Vercel/배포 환경 설정

Vercel 대시보드에서 환경 변수 설정:
1. 프로젝트 → Settings → Environment Variables
2. 다음 변수 추가:
   - `IRACING_EMAIL`: iRacing 이메일
   - `IRACING_PASSWORD`: iRacing 비밀번호
   - `IRACING_MOCK`: (설정하지 않으면 자동으로 false)

## 확인 사항

### ✅ Mock 모드 확인
- `IRACING_MOCK` 환경 변수가 설정되어 있지 않거나 `false`여야 합니다.
- `IRACING_MOCK=true`로 설정되어 있으면 Mock 데이터만 사용됩니다.

### ✅ API 인증 정보 확인
- `IRACING_EMAIL`: iRacing 계정 이메일
- `IRACING_PASSWORD`: iRacing 계정 비밀번호

## 테스트

환경 변수 설정 후 다음 API를 테스트해보세요:

1. **드라이버 검색**: `/api/iracing/driver/search?q=your_name`
2. **드라이버 프로필**: `/api/iracing/driver/[custId]`
3. **세션 요약**: `/api/iracing/session/[sessionId]/summary`

## 디버깅

### 환경 변수 및 인증 상태 확인

디버그 엔드포인트를 사용하여 환경 변수와 인증 상태를 확인할 수 있습니다:

```bash
# 브라우저 또는 curl로 접근
http://localhost:3000/api/iracing/debug
```

이 엔드포인트는 다음을 확인합니다:
- 환경 변수가 올바르게 설정되었는지
- 이메일/비밀번호 형식이 올바른지
- 실제 iRacing API 인증 테스트
- 레거시 인증 활성화 여부 (인증 실패 시 표시)

## 문제 해결

### 인증 실패 (`authcode: 0`, "Authentication failure")

**가장 흔한 원인**: 레거시 인증이 활성화되지 않음

해결 방법 (순서대로 확인):

1. ✅ **디버그 엔드포인트로 확인**
   ```bash
   # 브라우저에서 접근
   http://localhost:3000/api/iracing/debug
   ```
   - 환경 변수가 올바르게 로드되었는지 확인
   - 실제 인증 테스트 결과 확인

2. ✅ **레거시 인증 활성화 확인** (가장 중요!)
   - https://oauth.iracing.com/accountmanagement/ 접속
   - Security 섹션으로 이동
   - "Enable Legacy Authentication" 버튼이 **활성화되어 있는지** 확인
   - 만약 비활성화되어 있다면 클릭하여 활성화
   - ⚠️ 레거시 인증을 활성화한 후 **서버를 재시작**해야 합니다

3. ✅ **서버 재시작**
   ```bash
   # 개발 서버 중지 (Ctrl+C)
   npm run dev
   ```
   - 환경 변수 변경 후 반드시 재시작 필요
   - 레거시 인증 활성화 후에도 재시작 권장

4. ✅ **이메일/비밀번호 확인**
   - iRacing 웹사이트(https://members.iracing.com)에서 직접 로그인하여 확인
   - 비밀번호에 특수문자가 있으면 따옴표로 감싸기: `IRACING_PASSWORD="your@password#123"`
   - `.env.local` 파일에서 공백이나 줄바꿈이 없는지 확인

5. ✅ **iRacing 계정 상태 확인**
   - 구독이 만료되지 않았는지 확인
   - 계정이 정지되지 않았는지 확인

6. ✅ **환경 변수 파일 위치 확인**
   - `.env.local` 파일이 `ghostx_front` 디렉토리에 있는지 확인
   - 파일 이름이 정확한지 확인 (`.env.local` 또는 `.env`)

### API 오류
- iRacing API 상태 확인: https://status.iracing.com
- Rate limit 확인 (분당 60회 제한)
- 캐시 클리어 후 재시도

## 보안 주의사항

⚠️ **중요**: 
- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- `.gitignore`에 `.env*` 파일이 포함되어 있는지 확인
- 프로덕션 환경에서는 환경 변수를 안전하게 관리하세요

