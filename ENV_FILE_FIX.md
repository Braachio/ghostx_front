# 환경 변수 파일 수정 가이드

## 문제
`IRACING_PASSWORD`가 `NOT SET`으로 표시되는 경우, 비밀번호에 특수문자가 포함되어 있을 수 있습니다.

## 해결 방법

### 방법 1: 따옴표로 감싸기 (권장)

`.env.local` 파일에서 비밀번호를 따옴표로 감싸세요:

```bash
IRACING_EMAIL=josanghn@gmail.com
IRACING_PASSWORD="#jOS@%ang01"
```

또는 작은따옴표:

```bash
IRACING_EMAIL=josanghn@gmail.com
IRACING_PASSWORD='#jOS@%ang01'
```

### 방법 2: 특수문자 이스케이프

특수문자를 이스케이프하거나 URL 인코딩:

```bash
IRACING_PASSWORD=%23jOS%40%25ang01
```

### 방법 3: 환경 변수 직접 설정 (Windows)

PowerShell에서:
```powershell
$env:IRACING_EMAIL="josanghn@gmail.com"
$env:IRACING_PASSWORD="#jOS@%ang01"
```

## 확인

서버 재시작 후 콘솔에서 확인:
```
[iRacing API]   IRACING_PASSWORD: *** (length: 11)
```

길이가 표시되면 정상적으로 로드된 것입니다.



