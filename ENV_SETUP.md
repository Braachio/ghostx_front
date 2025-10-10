# 환경 변수 설정 가이드

## 문제 해결

### 1. 이메일 인증 링크가 localhost로 잡히는 문제

**원인**: `NEXT_PUBLIC_SITE_URL` 환경 변수가 설정되지 않았거나 localhost로 설정됨

**해결 방법**:
1. `.env.local` 파일 생성 (또는 Vercel 환경 변수 설정)
2. 다음 변수 추가:
```env
NEXT_PUBLIC_SITE_URL=https://ghostx.site
```

3. Vercel에 배포한 경우, Vercel 대시보드에서 설정:
   - Settings → Environment Variables
   - `NEXT_PUBLIC_SITE_URL` 추가
   - Value: `https://ghostx.site`
   - 모든 환경(Production, Preview, Development)에 적용

4. 재배포 필요

### 2. Supabase 설정 확인

Supabase 대시보드에서 다음을 확인:

1. **이메일 인증 활성화**:
   - Authentication → Settings → Email Auth
   - "Confirm email" 활성화

2. **Redirect URLs 설정**:
   - Authentication → URL Configuration
   - Redirect URLs에 추가:
     - `https://ghostx.site/auth/callback`
     - `http://localhost:3000/auth/callback` (개발용)

3. **Site URL 설정**:
   - Authentication → URL Configuration
   - Site URL: `https://ghostx.site`

### 3. 환경 변수 전체 목록

#### 필수 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 사이트 URL (프로덕션 URL로 설정!)
NEXT_PUBLIC_SITE_URL=https://ghostx.site

# 백엔드 API (FastAPI)
NEXT_PUBLIC_API_URL=https://your-backend.com

# Steam Web API Key (Steam 로그인용)
STEAM_WEB_API_KEY=your_steam_web_api_key

# 환경
NODE_ENV=production
```

**Steam API 키 발급 방법**:
1. [Steam Developer](https://steamcommunity.com/dev/apikey) 접속
2. Domain Name: `ghostx.site` 입력
3. API Key 복사하여 환경 변수에 추가

#### 로컬 개발 환경

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### 4. 체크리스트

- [ ] `.env.local` 파일에 `NEXT_PUBLIC_SITE_URL` 설정
- [ ] Vercel 환경 변수에 `NEXT_PUBLIC_SITE_URL` 추가
- [ ] Supabase에서 "Confirm email" 활성화
- [ ] Supabase Redirect URLs에 `https://ghostx.site/auth/callback` 추가
- [ ] Supabase Site URL을 `https://ghostx.site`로 설정
- [ ] 재배포 후 테스트

### 5. 테스트 방법

1. 새로운 이메일로 회원가입
2. 이메일 확인 - 링크가 `https://ghostx.site/auth/callback`로 시작하는지 확인
3. 이메일 링크 클릭
4. 온보딩 페이지로 리다이렉트되는지 확인
5. 로그인 시도
6. `/api/me` 호출 시 500 에러 없이 정상 동작하는지 확인

## 변경 사항 요약

### 수정된 파일

1. **`app/auth/callback/route.ts`** (신규 생성)
   - 이메일 인증 후 콜백 처리
   - 프로필 자동 생성

2. **`app/api/signup/route.ts`**
   - `NEXT_PUBLIC_SITE_URL` fallback 추가 (`https://ghostx.site`)
   - 회원가입 시 프로필 자동 생성

3. **`app/api/me/route.ts`**
   - 프로필이 없을 경우 자동 생성 로직 추가
   - 500 에러 방지

4. **`app/api/login/route.ts`**
   - 프로덕션 환경에서 이메일 인증 확인
   - 개발 환경에서는 이메일 인증 우회 가능

## 문제 해결 순서

1. 환경 변수 설정 확인
2. Supabase 설정 확인
3. 재배포
4. 테스트

문제가 지속되면 로그를 확인하세요:
- Vercel 대시보드 → Functions 탭 → Logs
- Supabase 대시보드 → Logs

