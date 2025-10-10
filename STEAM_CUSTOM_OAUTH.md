# 🎮 Steam 커스텀 OAuth 구현 가이드

## 개요
Supabase가 Steam OAuth를 기본 지원하지 않기 때문에, Steam OpenID를 직접 구현했습니다.

## 구현 방식

### Steam OpenID 인증 플로우

```
1. 사용자 → "Steam으로 로그인" 클릭
2. /api/auth/steam → Steam OpenID 로그인 페이지로 리다이렉트
3. Steam → 사용자 인증
4. Steam → /api/auth/steam/callback으로 콜백
5. 서버 → Steam OpenID 검증
6. 서버 → Steam API로 사용자 정보 조회
7. 서버 → Supabase에 사용자 생성/로그인
8. 서버 → /dashboard로 리다이렉트
```

## 필수 설정

### 1. Steam Web API 키 발급

1. [Steam Developer](https://steamcommunity.com/dev/apikey) 접속
2. Steam 계정 로그인
3. **Domain Name**: `ghostx.site` 입력
4. API 키 발급 받기

### 2. 환경 변수 설정

#### Vercel 환경 변수 추가

```env
STEAM_WEB_API_KEY=your_steam_api_key_here
```

#### .env.local (로컬 개발용)

```env
STEAM_WEB_API_KEY=your_steam_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 데이터베이스 마이그레이션

Supabase 대시보드 → SQL Editor에서 실행:

```sql
-- Steam 연동을 위한 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS steam_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS steam_avatar TEXT;

-- Steam ID 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_steam_id ON profiles(steam_id);
```

또는 `DATABASE_MIGRATION.sql` 파일의 내용을 실행하세요.

## 구현 파일

### 백엔드 API

1. **`app/api/auth/steam/route.ts`**
   - Steam OpenID 로그인 시작
   - Steam 로그인 페이지로 리다이렉트

2. **`app/api/auth/steam/callback/route.ts`**
   - Steam OpenID 콜백 처리
   - Steam ID 검증
   - Steam API로 사용자 정보 조회
   - Supabase 사용자 생성/로그인

### 프론트엔드

3. **`app/login/page.tsx`**
   - "Steam으로 로그인" 버튼
   - `/api/auth/steam`으로 리다이렉트

### 데이터베이스

4. **`DATABASE_MIGRATION.sql`**
   - `profiles` 테이블에 `steam_id`, `steam_avatar` 컬럼 추가

## Steam 사용자 처리 방식

### 이메일 처리

Steam은 이메일을 제공하지 않으므로:
- 가상 이메일 생성: `steam_{STEAM_ID}@ghostx.site`
- 예: `steam_76561198012345678@ghostx.site`

### 비밀번호 처리

- Steam ID를 비밀번호로 사용 (외부 노출 안 됨)
- 사용자는 비밀번호를 알 필요 없음 (Steam으로만 로그인)

### 프로필 정보

Steam API에서 가져오는 정보:
- **Steam ID**: 고유 식별자
- **Nickname**: Steam 닉네임 (personaname)
- **Avatar**: Steam 프로필 이미지 (avatarfull)

## 보안 고려사항

### Steam OpenID 검증

1. **검증 필수**: 모든 Steam 콜백은 반드시 검증
2. **재검증**: Steam OpenID 서버에 `check_authentication` 요청
3. **타임아웃**: 검증 실패 시 로그인 거부

### API 키 보안

- **절대 프론트엔드 노출 금지**
- 서버 사이드에서만 사용
- 환경 변수로만 관리

### 세션 관리

- Supabase Auth 세션 사용
- Steam 로그인도 일반 로그인과 동일한 세션 관리

## 테스트 방법

### 로컬 테스트

1. 환경 변수 설정:
```bash
# .env.local
STEAM_WEB_API_KEY=your_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

2. 개발 서버 실행:
```bash
npm run dev
```

3. http://localhost:3000/login 접속
4. "Steam으로 로그인" 클릭
5. Steam 인증 진행

### 프로덕션 테스트

1. Vercel 환경 변수 설정
2. 배포
3. https://ghostx.site/login 접속
4. "Steam으로 로그인" 클릭

## 문제 해결

### "steam_auth_failed" 오류

**원인**: Steam OpenID 응답이 올바르지 않음

**해결**:
1. Steam 로그인 페이지에서 제대로 인증했는지 확인
2. 콜백 URL이 올바른지 확인

### "invalid_steam_id" 오류

**원인**: Steam ID를 추출할 수 없음

**해결**:
1. Steam OpenID 응답 형식 확인
2. 로그 확인

### "steam_validation_failed" 오류

**원인**: Steam OpenID 검증 실패

**해결**:
1. 네트워크 연결 확인
2. Steam OpenID 서버 상태 확인
3. 콜백 파라미터가 변조되지 않았는지 확인

### "steam_user_info_failed" 오류

**원인**: Steam API에서 사용자 정보를 가져올 수 없음

**해결**:
1. `STEAM_WEB_API_KEY` 환경 변수 확인
2. Steam API 키가 유효한지 확인
3. Steam API 서버 상태 확인

### "database_error" 오류

**원인**: Supabase 데이터베이스 오류

**해결**:
1. 데이터베이스 마이그레이션 실행 확인
2. `profiles` 테이블에 `steam_id`, `steam_avatar` 컬럼 존재 확인
3. RLS 정책 확인

## 추가 기능 아이디어

### 1. Steam 프로필 연동

- Steam 게임 라이브러리 조회
- 플레이 시간 통계
- 최근 게임 활동

### 2. Steam 친구 목록

- Steam 친구 찾기
- 친구 초대 기능

### 3. Steam 도전 과제

- 레이싱 게임 도전 과제 연동
- 도전 과제 기반 리더보드

## API 엔드포인트

### `/api/auth/steam`

**Method**: GET

**Description**: Steam OpenID 로그인 시작

**Response**: Steam 로그인 페이지로 리다이렉트

### `/api/auth/steam/callback`

**Method**: GET

**Description**: Steam OpenID 콜백 처리

**Parameters** (Steam에서 자동 전달):
- `openid.mode`: 응답 모드
- `openid.claimed_id`: Steam ID를 포함한 URL
- 기타 OpenID 파라미터들

**Response**: 
- 성공 시: `/dashboard`로 리다이렉트
- 실패 시: `/login?error={error_code}`로 리다이렉트

## 체크리스트

설정 완료 확인:
- [ ] Steam Web API 키 발급
- [ ] Vercel 환경 변수 `STEAM_WEB_API_KEY` 설정
- [ ] 데이터베이스 마이그레이션 실행
- [ ] `profiles` 테이블에 `steam_id`, `steam_avatar` 컬럼 추가
- [ ] 로컬 테스트 완료
- [ ] 프로덕션 배포
- [ ] 프로덕션 테스트 완료

## 참고 자료

- [Steam Web API 문서](https://developer.valvesoftware.com/wiki/Steam_Web_API)
- [Steam OpenID 문서](https://steamcommunity.com/dev)
- [OpenID 2.0 스펙](https://openid.net/specs/openid-authentication-2_0.html)

## 주의사항

1. **Steam API 키 노출 금지**: 절대 프론트엔드 코드나 GitHub에 커밋하지 마세요
2. **검증 필수**: 모든 Steam 콜백은 반드시 검증해야 합니다
3. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS 사용
4. **에러 처리**: 모든 단계에서 적절한 에러 처리 필요

