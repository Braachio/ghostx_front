# iRacing SDK 통합 가이드

## 개요

iRacing SDK는 공유 메모리(Shared Memory) 방식을 사용하여 실시간 텔레메트리 데이터를 제공합니다. 브라우저에서 직접 접근할 수 없으므로, 로컬 서비스가 필요합니다.

## 아키텍처

```
[iRacing Simulator] 
    ↓ (공유 메모리)
[로컬 SDK 서비스] (Node.js/Python)
    ↓ (HTTP API)
[Next.js API] (/api/iracing/telemetry/upload)
    ↓
[Supabase Database]
```

## 구현 방법

### 옵션 1: 로컬 Node.js 서비스 (추천)

**장점:**
- TypeScript/JavaScript로 통일된 개발 환경
- 기존 Next.js API와 쉽게 통합
- 크로스 플랫폼 가능 (Windows 주로)

**필요한 패키지:**
- `iracing-sdk` 또는 `node-irsdk` (Node.js용 iRacing SDK 래퍼)
- 또는 직접 공유 메모리 읽기 (Windows: `mmap-io`)

### 옵션 2: Python 서비스

**장점:**
- 공식 SDK 문서가 Python 예제 제공
- 데이터 분석 라이브러리 풍부 (pandas, numpy)

**필요한 패키지:**
- `irsdk` (Python용 iRacing SDK)

## 구현 계획

### 1단계: 로컬 서비스 스크립트 생성
- iRacing SDK에서 데이터 읽기
- 실시간으로 서버 API로 전송
- 세션 시작/종료 감지

### 2단계: 웹 UI에서 서비스 연결
- 로컬 서비스 상태 확인
- 세션 시작/중지 제어
- 실시간 데이터 모니터링

### 3단계: 자동 수집 설정
- iRacing 실행 시 자동 시작
- 백그라운드 서비스로 실행

## 다음 단계

로컬 서비스 스크립트를 만들어드릴까요? (Node.js 또는 Python)

