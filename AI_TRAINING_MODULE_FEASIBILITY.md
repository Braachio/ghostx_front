# AI 교정 훈련 모듈 구현 가능성 분석

## 🎯 사용자 요구사항

**핵심 아이디어**: VRS처럼 데이터 분석에서 그치는 것이 아니라, **근육 기억을 교정하는 반복 훈련**까지 제공

### 시나리오
1. AI가 문제 진단: "T4 헤어핀에서 브레이킹이 0.2초 빠름"
2. 유저가 "훈련 시작" 클릭
3. 차량이 자동으로 T4 코너 300m 앞으로 이동
4. 유저가 코너 공략
5. 코너 통과 시 **즉시 리셋** → T4 300m 앞으로 다시 이동
6. 5분간 30-40회 반복 훈련

---

## ✅ 구현 가능한 부분

### 1. **AI 문제 진단** (현재 MVP 범위)
- ✅ 텔레메트리 데이터 수집
- ✅ 코너별 분석 (브레이킹, 가속, 라인)
- ✅ 프로 드라이버와 비교
- ✅ 시간 손실 원인 식별

### 2. **타겟 코너 식별**
- ✅ GPS 데이터로 특정 코너 위치 식별
- ✅ 코너 진입/이탈 감지
- ✅ 코너 구간 데이터 추출

### 3. **실시간 피드백 오버레이**
- ✅ 이상적인 주행 라인 표시 (주행 라인 시각화에 이미 구현됨)
- ✅ 실시간 브레이킹/액셀 그래프 (입력 게이지 HUD에 이미 구현됨)
- ✅ 목표 값과 현재 값 비교

---

## ⚠️ 제약사항 (iRacing SDK 한계)

### **iRacing SDK는 읽기 전용**
- iRacing SDK는 **텔레메트리 데이터를 읽기만** 가능
- 차량 위치 제어 불가
- 세션 리셋 제어 불가
- 차량 이동 제어 불가

### **iRacing 공식 제어 API 없음**
- iRacing은 차량/세션을 외부에서 제어하는 공식 API를 제공하지 않음
- 보안상의 이유로 게임 상태 변경을 외부 도구가 막아놓음

---

## 💡 실용적인 대안 (단계적 구현)

### **Phase 1: 반자동화 훈련 모듈** (즉시 구현 가능)

#### 1. AI 진단 및 안내
```
AI: "T4 헤어핀에서 브레이킹이 0.2초 빠릅니다."
→ "지금 T4 집중 훈련을 시작하세요" 버튼
```

#### 2. 훈련 모드 활성화
- 유저가 버튼 클릭
- ghostx가 **실시간 모니터링 모드** 시작
- T4 코너 진입/이탈 자동 감지

#### 3. 코너별 실시간 피드백
- T4 진입 시 화면에 **이상적인 라인** 오버레이
- 실시간 브레이킹/액셀 그래프 표시
- 목표 값 vs 현재 값 비교

#### 4. 수동 리셋 가이드
- 코너 통과 후 ghostx가 **"Ctrl+R을 눌러 리셋하세요"** 알림
- 또는 **"다음 랩을 시작하세요"** 안내
- 유저가 수동으로 리셋 (또는 랩 재시작)

#### 5. 훈련 통계
- "5분 동안 T4 코너 12회 공략"
- "평균 브레이킹 타이밍: 목표 대비 0.15초 빠름 → 0.10초 빠름 (개선됨!)"

**장점**: 
- ✅ 즉시 구현 가능
- ✅ iRacing SDK 한계 없이 작동
- ✅ 실용적인 훈련 효과

**단점**: 
- ❌ 완전 자동화 아님 (유저가 수동 리셋 필요)

---

### **Phase 2: 키보드 입력 자동화** (중간 난이도)

#### AutoHotkey / Python `pyautogui` 활용
- ghostx가 **키보드 입력 자동화** 도구 제공
- T4 코너 통과 감지 → 자동으로 `Ctrl+R` 입력
- 차량이 자동으로 리셋

**구현 방법**:
```python
# ghostx_fastapi/services/training_auto_reset.py
import pyautogui
import time

def auto_reset_on_corner_exit():
    """코너 통과 시 자동 리셋"""
    # T4 코너 이탈 감지
    if corner_exit_detected:
        # iRacing 리셋 단축키 (Ctrl+R)
        pyautogui.hotkey('ctrl', 'r')
        time.sleep(2)  # 리셋 대기
        # 필요시 특정 위치로 이동 (키보드 입력으로)
```

**장점**:
- ✅ 완전 자동화 가능
- ✅ Phase 1보다 사용자 편의성 향상

**단점**:
- ⚠️ 보안 소프트웨어가 차단할 수 있음
- ⚠️ iRacing 업데이트 시 단축키 변경 가능성
- ⚠️ 사용자가 도구 설치 필요

---

### **Phase 3: iRacing 메모리 패치** (고난이도, 위험)

#### 메모리 직접 접근
- iRacing 프로세스 메모리 직접 수정
- 차량 위치 좌표를 직접 변경

**위험성**:
- ❌ iRacing의 안티치트 시스템에 의해 계정 밴 위험
- ❌ 게임 업데이트 시 코드 무효화
- ❌ 법적/윤리적 문제 가능성

**결론**: ❌ **권장하지 않음**

---

## 🎯 권장 구현 전략

### **즉시 구현: Phase 1 (반자동화)**

#### 1. 데이터베이스 스키마
```sql
-- 훈련 세션 저장
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    track_id INTEGER,
    corner_name VARCHAR(100),
    target_metric VARCHAR(50), -- 'braking_timing', 'line', etc.
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    improvement_score FLOAT
);

-- 훈련 시도 기록
CREATE TABLE training_attempts (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES training_sessions(id),
    attempt_number INTEGER,
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    metrics JSONB, -- 브레이킹, 라인, 속도 등
    score FLOAT
);
```

#### 2. 프론트엔드 컴포넌트
- `TrainingModule.tsx`: AI 진단 결과 표시 및 훈련 시작 버튼
- `CornerTrainingOverlay.tsx`: 실시간 피드백 오버레이
- `TrainingProgress.tsx`: 훈련 통계 및 진행 상황

#### 3. 백엔드 API
- `/api/training/start`: 훈련 세션 시작
- `/api/training/corner-detect`: 코너 진입/이탈 감지
- `/api/training/feedback`: 실시간 피드백 계산
- `/api/training/complete`: 훈련 세션 완료

#### 4. iRacing SDK 통합
- 기존 `iracing_sdk_collector.py` 확장
- 코너 진입/이탈 이벤트 감지
- 실시간 데이터를 훈련 모듈로 전송

---

## 📊 구현 우선순위

### **MVP (1-2주)**
1. ✅ AI 진단 결과 표시
2. ✅ "훈련 시작" 버튼
3. ✅ 코너 진입/이탈 감지
4. ✅ 실시간 피드백 오버레이 (라인, 그래프)

### **V2 (2-4주)**
5. ✅ 훈련 통계 및 진행 상황
6. ✅ 개선 점수 계산
7. ✅ 자동 리셋 가이드 (키보드 단축키 안내)

### **V3 (선택사항)**
8. ⚠️ 키보드 입력 자동화 (AutoHotkey 통합)
9. ⚠️ 특정 위치로 이동 가이드 (랩 시작 시점 조절)

---

## 🚀 결론

**핵심 기능은 구현 가능합니다!**

- ✅ AI 진단: 가능
- ✅ 타겟 코너 식별: 가능
- ✅ 실시간 피드백: 가능
- ✅ 반복 훈련 가이드: 가능 (반자동화)
- ⚠️ 완전 자동 리셋: 제한적 (키보드 자동화 필요)

**권장 접근**: Phase 1 (반자동화)로 시작하여 사용자 피드백을 받은 후, 필요시 Phase 2 (키보드 자동화)로 확장

이는 VRS와의 **명확한 차별점**이 되며, "데이터 분석"에서 "근육 기억 교정"까지 제공하는 혁신적인 기능입니다.



