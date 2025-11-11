# 🎮 자체 훈련 모듈 구현 계획

## ✅ 완전히 구현 가능!

iRacing 연동 없이 **브라우저에서 바로 플레이 가능한** 독립적인 훈련 모듈입니다.

---

## 🎯 핵심 기능

### 1. **간단한 2D 레이싱 시뮬레이터**
- HTML5 Canvas 또는 SVG로 트랙 렌더링
- 키보드 입력으로 차량 조작 (방향키, 스페이스바)
- 실시간 차량 물리 (속도, 가속, 브레이킹, 스티어링)

### 2. **AI 기준 라인 표시**
- 이상적인 주행 라인 오버레이
- 목표 브레이킹 포인트 표시
- 목표 액셀 포인트 표시

### 3. **실시간 피드백**
- 현재 라인 vs 목표 라인 비교
- 브레이킹 타이밍 (빠름/늦음)
- 액셀 타이밍 (빠름/늦음)
- 속도 비교

### 4. **코너 구간 리셋**
- 코너 통과 시 자동/수동 리셋
- 특정 위치로 즉시 이동
- 반복 훈련 카운터

### 5. **훈련 통계**
- 시도 횟수
- 개선 점수
- 평균 오차율

---

## 🛠️ 기술 스택

### **프론트엔드 (React + TypeScript)**
- **Canvas API**: 2D 렌더링
- **requestAnimationFrame**: 60fps 게임 루프
- **키보드 이벤트**: 사용자 입력
- **기존 컴포넌트 재사용**: 
  - `TrackMap` (SVG 기반 주행 라인)
  - 입력 게이지 HUD (스로틀, 브레이크, 스티어링)

### **물리 엔진 (간단한 구현)**
```typescript
// 차량 상태
interface CarState {
  x: number          // X 좌표
  y: number          // Y 좌표
  angle: number      // 회전 각도
  speed: number      // 속도 (km/h)
  acceleration: number // 가속도
}

// 간단한 물리 계산
function updateCar(car: CarState, inputs: {
  throttle: number,  // 0-1
  brake: number,     // 0-1
  steering: number   // -1 to 1 (좌/우)
}, deltaTime: number) {
  // 가속도 계산
  const maxAccel = 100 // km/h per second
  const maxBrake = 150 // km/h per second
  const maxSpeed = 200 // km/h
  
  if (inputs.throttle > 0) {
    car.acceleration = inputs.throttle * maxAccel
  } else if (inputs.brake > 0) {
    car.acceleration = -inputs.brake * maxBrake
  } else {
    car.acceleration = -car.speed * 0.1 // 자연 감속
  }
  
  // 속도 업데이트
  car.speed = Math.max(0, Math.min(maxSpeed, 
    car.speed + car.acceleration * deltaTime
  ))
  
  // 스티어링
  const steeringAngle = inputs.steering * 0.5 // 최대 0.5 라디안
  car.angle += steeringAngle * (car.speed / maxSpeed) // 속도에 비례
  
  // 위치 업데이트
  car.x += Math.cos(car.angle) * car.speed * deltaTime * 0.0278 // km/h → m/s → px
  car.y += Math.sin(car.angle) * car.speed * deltaTime * 0.0278
}
```

### **트랙 정의**
```typescript
interface Track {
  name: string
  corners: Corner[]
  idealLine: Point[]  // 이상적인 주행 라인
}

interface Corner {
  name: string
  entryPoint: Point   // 진입 지점
  apex: Point         // 아펙스
  exitPoint: Point    // 이탈 지점
  brakingPoint?: Point // 브레이킹 포인트
  targetSpeed?: number // 목표 속도
}
```

---

## 📁 파일 구조

```
ghostx_front/
├── app/
│   └── training/
│       └── page.tsx              # 훈련 페이지
├── components/
│   ├── training/
│   │   ├── TrainingModule.tsx    # 메인 훈련 모듈
│   │   ├── RacingSimulator.tsx   # 2D 레이싱 시뮬레이터
│   │   ├── CarPhysics.ts         # 차량 물리 엔진
│   │   ├── TrackRenderer.tsx     # 트랙 렌더링
│   │   ├── TrainingOverlay.tsx   # 피드백 오버레이
│   │   ├── TrainingStats.tsx     # 훈련 통계
│   │   └── CornerDetector.ts    # 코너 진입/이탈 감지
│   └── ...
└── lib/
    └── tracks/
        ├── brandsHatch.ts       # 브랜즈 해치 트랙 정의
        ├── silverstone.ts       # 실버스톤 트랙 정의
        └── ...
```

---

## 🎮 사용자 인터페이스

### **훈련 시작 화면**
```
┌─────────────────────────────────────┐
│  🎯 T4 헤어핀 집중 훈련             │
│                                     │
│  문제: 브레이킹이 0.2초 빠름       │
│  목표: 이상적인 브레이킹 타이밍     │
│                                     │
│  [훈련 시작] 버튼                   │
└─────────────────────────────────────┘
```

### **훈련 중 화면**
```
┌─────────────────────────────────────┐
│  🏁 시뮬레이터 (Canvas)             │
│  ┌─────────────────────────────┐   │
│  │  [트랙 + 차량 + 라인]        │   │
│  │                             │   │
│  │  🚗 (현재 차량)             │   │
│  │  ━━ (이상적인 라인)         │   │
│  │  ⚠️ (브레이킹 포인트)        │   │
│  └─────────────────────────────┘   │
│                                     │
│  실시간 피드백:                     │
│  - 브레이킹: 0.15초 빠름 ⚠️        │
│  - 라인: 2m 이탈                   │
│                                     │
│  [리셋] [일시정지]                  │
│                                     │
│  시도 횟수: 12/30                   │
└─────────────────────────────────────┘
```

### **피드백 오버레이**
- 화면 상단: 현재 상태 (속도, 기어)
- 화면 하단: 입력 게이지 (스로틀, 브레이크, 스티어링)
- 화면 오른쪽: 실시간 비교 (목표 vs 현재)

---

## 🚀 구현 단계

### **Phase 1: 기본 시뮬레이터 (1주)**
1. ✅ Canvas 기반 렌더링
2. ✅ 키보드 입력 감지
3. ✅ 간단한 차량 물리
4. ✅ 직선 트랙 렌더링

### **Phase 2: 코너 훈련 (1주)**
5. ✅ 코너 트랙 정의
6. ✅ 코너 진입/이탈 감지
7. ✅ 자동 리셋 기능
8. ✅ 이상적인 라인 표시

### **Phase 3: 피드백 시스템 (1주)**
9. ✅ 실시간 비교 (목표 vs 현재)
10. ✅ 브레이킹/액셀 타이밍 피드백
11. ✅ 시각적 피드백 (색상, 텍스트)

### **Phase 4: 통계 및 완성 (1주)**
12. ✅ 훈련 통계 저장
13. ✅ 개선 점수 계산
14. ✅ 다중 코너 지원

---

## 💡 구현 예시 코드

### **RacingSimulator.tsx (간단한 예시)**
```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

export default function RacingSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [car, setCar] = useState({
    x: 100,
    y: 100,
    angle: 0,
    speed: 0,
    acceleration: 0
  })
  const [inputs, setInputs] = useState({
    throttle: 0,
    brake: 0,
    steering: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 게임 루프
    let lastTime = performance.now()
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000 // 초 단위
      lastTime = currentTime

      // 물리 업데이트
      updatePhysics(car, inputs, deltaTime)
      
      // 렌더링
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawTrack(ctx, canvas)
      drawCar(ctx, car)
      drawIdealLine(ctx)
      
      requestAnimationFrame(gameLoop)
    }
    
    gameLoop(performance.now())
  }, [car, inputs])

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setInputs(prev => ({ ...prev, throttle: 1 }))
      if (e.key === 'ArrowDown') setInputs(prev => ({ ...prev, brake: 1 }))
      if (e.key === 'ArrowLeft') setInputs(prev => ({ ...prev, steering: -1 }))
      if (e.key === 'ArrowRight') setInputs(prev => ({ ...prev, steering: 1 }))
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setInputs(prev => ({ ...prev, throttle: 0 }))
      if (e.key === 'ArrowDown') setInputs(prev => ({ ...prev, brake: 0 }))
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setInputs(prev => ({ ...prev, steering: 0 }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-800 rounded-lg"
      />
      {/* 입력 게이지 오버레이 */}
      <TrainingOverlay inputs={inputs} car={car} />
    </div>
  )
}
```

---

## 🎯 장점

### **완전 독립적**
- ✅ iRacing 구독 불필요
- ✅ 외부 프로그램 불필요
- ✅ 브라우저에서 즉시 실행
- ✅ 모든 사용자가 접근 가능

### **완전한 제어**
- ✅ 차량 위치 제어 가능
- ✅ 즉시 리셋 가능
- ✅ 특정 구간만 반복 가능
- ✅ AI 기준 라인 완벽 제어

### **유연한 확장**
- ✅ 다양한 트랙 추가 가능
- ✅ 다양한 코너 타입
- ✅ 난이도 조절 가능
- ✅ 커스터마이징 가능

---

## 🚀 결론

**완전히 구현 가능하며, 오히려 더 좋습니다!**

- ✅ 기술적 제약 없음
- ✅ 즉시 시작 가능
- ✅ 사용자 경험 우수
- ✅ VRS와의 명확한 차별점

**다음 단계**: Phase 1부터 시작하시겠습니까?



