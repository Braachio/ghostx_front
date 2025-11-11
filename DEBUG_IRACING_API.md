# iRacing API 디버깅 가이드

## ⚠️ 필수 확인: 레거시 인증 활성화

iRacing API를 사용하려면 **레거시 인증이 활성화되어 있어야** 합니다:

1. https://members.iracing.com 에 로그인
2. **Account** → **Security** → **Legacy Authentication** 확인
3. 활성화되어 있지 않다면 활성화하고 몇 분 기다린 후 다시 시도

**증상**: `authcode: 0`, `message: "Authentication failure."` 오류가 발생하는 경우 레거시 인증이 비활성화된 상태입니다.

## 환경 변수 확인 방법

### 1. 서버 콘솔 확인

개발 서버를 실행하면 콘솔에 다음과 같은 로그가 나타납니다:

**Mock 모드인 경우:**
```
[iRacing API] Mock mode: IRACING_EMAIL or IRACING_PASSWORD not set
[iRacing API] Email: NOT SET (또는 ***)
[iRacing API] Password: NOT SET (또는 ***)
```

**실제 API 모드인 경우:**
```
[iRacing API] Real API mode: Credentials found
```

### 2. 환경 변수 파일 위치 확인

`.env.local` 파일은 반드시 **`ghostx_front`** 디렉토리 루트에 있어야 합니다:

```
ghostx_front/
  ├── .env.local  ← 여기에 있어야 함
  ├── app/
  ├── components/
  └── ...
```

### 3. 환경 변수 파일 형식

`.env.local` 파일 형식:

```bash
IRACING_EMAIL=your_email@example.com
IRACING_PASSWORD=your_password
```

⚠️ **주의사항:**
- 등호(`=`) 앞뒤에 공백이 없어야 합니다
- 비밀번호에 특수문자(`#`, `@`, `%` 등)가 포함된 경우 **따옴표로 감싸야** 합니다
  ```bash
  IRACING_PASSWORD="#jOS@%ang01"  # 올바름
  IRACING_PASSWORD=#jOS@%ang01    # 잘못됨 (# 이후가 주석으로 처리됨)
  ```
- 각 줄에 하나의 변수만 있어야 합니다

### 4. 서버 재시작 필수

환경 변수를 변경한 후에는 **반드시 개발 서버를 재시작**해야 합니다:

```bash
# 1. 서버 중지 (Ctrl+C)
# 2. 서버 재시작
npm run dev
```

### 5. 문제 해결 체크리스트

- [ ] `.env.local` 파일이 `ghostx_front` 디렉토리에 있는가?
- [ ] 파일 이름이 정확히 `.env.local`인가? (`.env`가 아님)
- [ ] `IRACING_EMAIL`과 `IRACING_PASSWORD`가 올바르게 설정되어 있는가?
- [ ] 등호(`=`) 앞뒤에 공백이 없는가?
- [ ] 서버를 재시작했는가?
- [ ] 서버 콘솔에서 어떤 모드가 활성화되었는지 확인했는가?

### 6. API 호출 시 로그 확인

실제 API를 사용할 때는 다음과 같은 로그가 나타납니다:

```
[iRacing API] Requesting new authentication token...
[iRacing API] Authentication successful, token expires in 300 seconds
[iRacing API] GET /data/member/get?cust_ids=12345
[Driver Search] Using real iRacing API
```

Mock 모드를 사용할 때는:

```
[Driver Search] Using mock data (IRACING_MOCK enabled or credentials missing)
```

