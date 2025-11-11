# iRacing API 인증 문제 해결 가이드

## 현재 상태 확인

디버그 엔드포인트 결과를 보면:
- ✅ 환경 변수는 올바르게 로드됨
- ❌ 인증 실패 (`authcode: 0`, "Authentication failure")

## 단계별 해결 방법

### 1단계: 레거시 인증 상태 재확인 ⚠️ 가장 중요!

1. **iRacing 계정 관리 페이지 접속**
   - https://oauth.iracing.com/accountmanagement/
   - iRacing 계정으로 로그인

2. **Security 섹션 확인**
   - Security 섹션으로 이동
   - "Legacy Authentication" 또는 "Legacy Read-Only Authentication" 섹션 찾기
   - **현재 상태 확인**:
     - ✅ "Enabled" 또는 "활성화됨"으로 표시되어야 함
     - ❌ "Disabled" 또는 "비활성화됨"이면 클릭하여 활성화

3. **활성화 확인**
   - 버튼을 클릭한 후 확인 대화상자에서 확인
   - 페이지를 새로고침하여 상태가 "Enabled"로 변경되었는지 확인

### 2단계: 웹사이트 직접 로그인 테스트

1. **iRacing 멤버 사이트 로그인**
   - https://members.iracing.com 접속
   - 디버그 엔드포인트에서 확인한 이메일과 동일한 이메일 사용
   - 비밀번호 입력하여 로그인 시도

2. **결과 확인**
   - ✅ 로그인 성공: 비밀번호는 정확함, 레거시 인증 문제일 가능성 높음
   - ❌ 로그인 실패: 비밀번호가 잘못되었거나 계정 문제

### 3단계: 환경 변수 재확인

`.env.local` 파일 확인:

```env
IRACING_EMAIL=your-email@gmail.com
IRACING_PASSWORD="your-password"
```

**주의사항:**
- 비밀번호에 특수문자(`@`, `#`, `$`, `%` 등)가 있으면 **반드시 따옴표로 감싸기**
- 공백이나 줄바꿈이 없어야 함
- 파일이 `ghostx_front` 디렉토리에 있어야 함

**예시:**
```env
# 올바른 형식
IRACING_PASSWORD="my@password#123"

# 잘못된 형식 (특수문자가 있으면 따옴표 없이)
IRACING_PASSWORD=my@password#123
```

### 4단계: 서버 재시작

레거시 인증을 활성화한 후:

1. 개발 서버 중지 (Ctrl+C)
2. 서버 재시작:
   ```bash
   npm run dev
   ```
3. 디버그 엔드포인트 다시 확인:
   - http://localhost:3000/api/iracing/debug

### 5단계: 계정 상태 확인

1. **구독 상태**
   - iRacing 구독이 활성화되어 있는지 확인
   - 구독이 만료되었으면 API 접근 불가

2. **계정 상태**
   - 계정이 정지되지 않았는지 확인
   - 이메일 인증이 완료되었는지 확인

### 6단계: 시간 대기

일부 경우 레거시 인증 활성화 후 몇 분(최대 5-10분) 기다려야 할 수 있습니다.

## 추가 확인 사항

### 2FA (Two-Factor Authentication) 사용 시

2FA를 사용하는 경우:
- 레거시 인증을 활성화해야 API 접근 가능
- 앱 비밀번호가 아닌 **일반 비밀번호** 사용
- 레거시 인증 활성화 후에도 일반 비밀번호로 API 접근 가능

### 비밀번호 특수문자 문제

비밀번호에 다음 문자가 포함된 경우:
- `@`, `#`, `$`, `%`, `&`, `*`, `(`, `)`, `[`, `]`, `{`, `}`, `|`, `\`, `/`, `?`, `!`, `~`, `` ` ``, `^`

**반드시 따옴표로 감싸기:**
```env
IRACING_PASSWORD="password@with#special$chars"
```

### 환경 변수 파일 위치

- ✅ 올바른 위치: `ghostx_front/.env.local`
- ❌ 잘못된 위치: `.env.local` (프로젝트 루트)
- ❌ 잘못된 위치: `ghostx_front/.env` (`.env.local` 사용 권장)

## 여전히 실패하는 경우

위의 모든 단계를 확인했는데도 실패한다면:

1. **iRacing 지원팀 문의**
   - https://support.iracing.com
   - 레거시 인증 활성화 후에도 API 접근이 안 된다고 문의

2. **임시 해결책: Mock 모드 사용**
   ```env
   IRACING_MOCK=true
   ```
   - 실제 API 대신 Mock 데이터 사용
   - 개발/테스트 목적으로만 사용

3. **디버그 정보 수집**
   - 디버그 엔드포인트 결과 저장
   - 서버 콘솔 로그 확인
   - iRacing 지원팀에 제공

## 성공 확인

인증이 성공하면 디버그 엔드포인트에서:
```json
{
  "authTest": {
    "success": true,
    "response": {
      "status": 200,
      "authcode": "토큰값",
      "hasToken": true
    }
  }
}
```

이 표시됩니다.

