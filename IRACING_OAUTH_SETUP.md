# iRacing OAuth 설정 완료 가이드

## ✅ 현재 상태

Nick이 클라이언트를 Password Limited Flow를 사용할 수 있도록 설정해주었습니다:

- **Client ID**: `gpx-racing-companion`
- **Audience**: `data-server`
- **사용 가능한 계정**: `josanghn@gmail.com`만 사용 가능
- **Flow**: Password Limited Flow 활성화됨
- **Client Secret**: 이메일로 받음 (1일 유효, 1회만 조회 가능)

## 🔧 환경 변수 설정

### 로컬 개발 환경 (`.env.local`)

```env
# iRacing OAuth
IRACING_CLIENT_ID=gpx-racing-companion
IRACING_CLIENT_SECRET=your_client_secret_from_email
IRACING_USERNAME=josanghn@gmail.com
IRACING_PASSWORD=your_iracing_password

# Authorization Code Flow (향후 사용자 로그인용)
IRACING_REDIRECT_URI=http://localhost:3000/api/iracing/oauth/callback
```

### 프로덕션 환경 (Vercel)

Vercel 대시보드 → Settings → Environment Variables에 다음을 추가:

```env
IRACING_CLIENT_ID=gpx-racing-companion
IRACING_CLIENT_SECRET=your_client_secret_from_email
IRACING_USERNAME=josanghn@gmail.com
IRACING_PASSWORD=your_iracing_password
IRACING_REDIRECT_URI=https://ghostx.site/api/iracing/oauth/callback
```

**⚠️ 보안 주의사항:**
- Client Secret과 Password는 절대 코드에 커밋하지 마세요
- 환경 변수에만 저장하세요
- Vercel 환경 변수는 암호화되어 저장됩니다

## 🧪 테스트 방법

### 1. 환경 변수 확인

로컬에서 테스트:
```bash
# .env.local 파일 확인
cat .env.local | grep IRACING
```

### 2. 토큰 획득 테스트

API를 호출하면 자동으로 Password Limited Flow로 토큰을 획득합니다:

```bash
# 예: 드라이버 정보 조회
curl http://localhost:3000/api/iracing/driver/search?q=test
```

### 3. 로그 확인

서버 로그에서 다음 메시지를 확인할 수 있습니다:

```
[iRacing OAuth] No refresh token available, attempting Password Limited flow
[iRacing OAuth] Tokens saved successfully
```

### 4. 수동 토큰 초기화 테스트

기존 토큰을 삭제하고 새로 획득하는 테스트:

1. Supabase에서 `iracing_tokens` 테이블의 레코드 삭제
2. API 호출 시 자동으로 Password Limited Flow로 토큰 획득

## 📋 동작 방식

### 토큰 획득 우선순위

1. **저장된 Access Token이 유효한 경우**: 그대로 사용
2. **Refresh Token이 있는 경우**: Refresh Token으로 새 Access Token 획득
3. **Refresh Token이 없거나 실패한 경우**: Password Limited Flow로 새 토큰 획득

### Password Limited Flow

- 서버에서 직접 토큰 요청 (redirect URI 불필요)
- `grant_type=password` 사용
- `josanghn@gmail.com` 계정만 사용 가능
- 2FA는 우회됨 (문서 참고)

## 🔄 향후 계획

### Authorization Code Flow (사용자 로그인)

향후 사용자가 각자의 iRacing 계정으로 로그인하는 기능을 추가할 때:

- `/api/iracing/oauth/login` 엔드포인트 사용
- 사용자가 브라우저에서 iRacing 로그인
- Redirect URI로 콜백 받아 토큰 획득
- 사용자별로 토큰 저장

현재는 redirect URI가 등록되어 있으므로, 나중에 이 기능을 추가할 수 있습니다.

## ❌ 문제 해결

### `unsupported_grant_type` 에러

- **원인**: 클라이언트가 Password Limited Flow를 허용하지 않음
- **해결**: ✅ 이미 Nick이 설정 완료

### `invalid_client` 에러

- **원인**: Client ID 또는 Client Secret이 잘못됨
- **해결**: 환경 변수 확인

### `invalid_grant` 에러

- **원인**: Username 또는 Password가 잘못됨
- **해결**: `IRACING_USERNAME`과 `IRACING_PASSWORD` 확인

### 토큰이 저장되지 않음

- **원인**: Supabase `iracing_tokens` 테이블 문제
- **해결**: 테이블 스키마 확인

## 📚 참고 자료

- [iRacing OAuth 문서](https://oauth.iracing.com/oauth2/book/)
- [Password Limited Flow 문서](https://oauth.iracing.com/oauth2/book/error_unsupported_grant_type.html)

