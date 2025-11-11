'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GamepadState {
  throttle: number  // 0-1 (오른쪽 트리거)
  brake: number    // 0-1 (왼쪽 트리거)
  steering: number // -1 to 1 (스티어링 휠)
  connected: boolean
}

interface CarState {
  x: number
  y: number
  angle: number
  speed: number // km/h
  acceleration: number
}

interface BrakingPoint {
  x: number
  y: number
  marker: string // 마커 표시
}

export default function BrakingPointTrainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gamepad, setGamepad] = useState<GamepadState>({
    throttle: 0,
    brake: 0,
    steering: 0,
    connected: false
  })
  const [car, setCar] = useState<CarState>({
    x: 100,
    y: 400,
    angle: 0, // 1인칭 시점: angle은 스티어링 각도 (0 = 정면, 양수 = 오른쪽, 음수 = 왼쪽)
    speed: 0,
    acceleration: 0
  })
  const [viewMode, setViewMode] = useState<'first-person' | 'third-person'>('third-person')
  const [isTraining, setIsTraining] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lastFeedback, setLastFeedback] = useState<string | null>(null)
  const [brakingPoint, setBrakingPoint] = useState<BrakingPoint>({
    x: 600,
    y: 400,
    marker: '100m'
  })
  const [brakingStarted, setBrakingStarted] = useState(false)
  const [brakingDistance, setBrakingDistance] = useState<number | null>(null)
  
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(performance.now())

  // Gamepad 감지
  useEffect(() => {
    const checkGamepad = () => {
      const gamepads = navigator.getGamepads()
      const gamepad = gamepads[0] // 첫 번째 게임패드 사용
      
      if (gamepad) {
        setGamepad(prev => ({ ...prev, connected: true }))
        
        // 레이싱 휠/페달 입력 감지
        // 트리거: 오른쪽(R2) = 액셀, 왼쪽(L2) = 브레이크
        // 스틱/스티어링: X축 = 스티어링
        const throttle = gamepad.buttons[7]?.value || 0 // R2
        const brake = gamepad.buttons[6]?.value || 0    // L2
        const steering = gamepad.axes[0] || 0           // 왼쪽 스틱 X축 또는 스티어링 휠
        
        setGamepad({
          throttle,
          brake,
          steering,
          connected: true
        })
      } else {
        setGamepad(prev => ({ ...prev, connected: false }))
      }
    }

    // 키보드 입력도 지원 (테스트용)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setGamepad(prev => ({ ...prev, throttle: 1 }))
      }
      if (e.key === 'ArrowDown') {
        setGamepad(prev => ({ ...prev, brake: 1 }))
      }
      if (e.key === 'ArrowLeft') {
        setGamepad(prev => ({ ...prev, steering: -1 }))
      }
      if (e.key === 'ArrowRight') {
        setGamepad(prev => ({ ...prev, steering: 1 }))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setGamepad(prev => ({ ...prev, throttle: 0 }))
      }
      if (e.key === 'ArrowDown') {
        setGamepad(prev => ({ ...prev, brake: 0 }))
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setGamepad(prev => ({ ...prev, steering: 0 }))
      }
    }

    // Gamepad 연결 이벤트
    window.addEventListener('gamepadconnected', (e) => {
      console.log('🎮 Gamepad connected:', e.gamepad.id)
      checkGamepad()
    })

    window.addEventListener('gamepaddisconnected', () => {
      console.log('🎮 Gamepad disconnected')
      setGamepad(prev => ({ ...prev, connected: false }))
    })

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // 폴링으로 게임패드 상태 업데이트
    const interval = setInterval(checkGamepad, 16) // ~60fps

    return () => {
      window.removeEventListener('gamepadconnected', checkGamepad)
      window.removeEventListener('gamepaddisconnected', checkGamepad)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      clearInterval(interval)
    }
  }, [])

  // 물리 업데이트
  const updatePhysics = useCallback((deltaTime: number) => {
    if (!isTraining) return

    setCar(prev => {
      const maxAccel = 80 // km/h per second
      const maxBrake = 120 // km/h per second
      const maxSpeed = 180 // km/h
      const friction = 0.05 // 자연 감속

      let newAcceleration = 0

      // 액셀/브레이크 계산
      if (gamepad.throttle > 0) {
        newAcceleration = gamepad.throttle * maxAccel
      } else if (gamepad.brake > 0) {
        newAcceleration = -gamepad.brake * maxBrake
        if (!brakingStarted && prev.speed > 50) {
          setBrakingStarted(true)
          // 브레이킹 시작 지점 기록
          const distanceToPoint = Math.sqrt(
            Math.pow(brakingPoint.x - prev.x, 2) + 
            Math.pow(brakingPoint.y - prev.y, 2)
          )
          setBrakingDistance(distanceToPoint)
        }
      } else {
        newAcceleration = -prev.speed * friction
      }

      // 속도 업데이트
      const newSpeed = Math.max(0, Math.min(maxSpeed, 
        prev.speed + newAcceleration * deltaTime
      ))

      // 스티어링 (속도에 비례)
      // 1인칭 시점: 스티어링은 차량의 각도만 변경 (차량은 항상 앞으로 이동)
      const steeringSensitivity = 0.4
      const maxSteeringAngle = Math.PI / 6 // 최대 30도
      const newAngle = Math.max(-maxSteeringAngle, Math.min(maxSteeringAngle,
        prev.angle + gamepad.steering * steeringSensitivity * (newSpeed / maxSpeed) * deltaTime
      ))

      // 위치 업데이트 (픽셀 단위)
      // 1인칭 시점: 차량은 항상 앞으로 이동 (Y축 양의 방향)
      // 스티어링은 차량의 방향만 변경 (X축 이동)
      const speedMps = newSpeed * 0.2778 // km/h → m/s
      const speedPxps = speedMps * 2 // 1m = 2px (스케일)
      
      // 차량은 항상 앞으로 이동 (Y축 양의 방향)
      // 스티어링 각도에 따라 횡방향 이동 (X축)
      const forwardSpeed = Math.cos(newAngle) * speedPxps * deltaTime // 앞으로 이동
      const lateralSpeed = Math.sin(newAngle) * speedPxps * deltaTime // 옆으로 이동
      
      const newX = prev.x + lateralSpeed
      const newY = prev.y + forwardSpeed

      // 브레이킹 포인트 통과 감지
      if (brakingStarted && newSpeed < 10) {
        // 브레이킹 완료
        const finalDistance = Math.sqrt(
          Math.pow(brakingPoint.x - newX, 2) + 
          Math.pow(brakingPoint.y - newY, 2)
        )
        
        const error = brakingDistance ? Math.abs(finalDistance - brakingDistance) : 0
        const accuracy = error < 20 ? '정확!' : error < 50 ? '좋음' : '늦음'
        
        setLastFeedback(`${accuracy} (오차: ${error.toFixed(0)}px)`)
        setBrakingStarted(false)
        setBrakingDistance(null)
        setAttempts(prev => prev + 1)
      }

      return {
        x: newX,
        y: newY,
        angle: newAngle,
        speed: newSpeed,
        acceleration: newAcceleration
      }
    })
  }, [isTraining, gamepad, brakingPoint, brakingStarted, brakingDistance])

  // 게임 루프
  useEffect(() => {
    if (!canvasRef.current || !isTraining) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000
      lastTimeRef.current = currentTime

      // 물리 업데이트
      updatePhysics(deltaTime)

      // 렌더링
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (viewMode === 'first-person') {
        // 1인칭 시점 렌더링 (운전자 시점)
        ctx.save()
        
        // 차량이 화면 하단 중앙에 위치하도록
        const carScreenX = canvas.width / 2
        const carScreenY = canvas.height - 100 // 하단에서 100px 위
        
        // 화면 중심을 차량 위치로 이동
        ctx.translate(carScreenX, carScreenY)
        
        // 1인칭 시점: 차량 각도에 따라 회전 (차량이 향하는 방향)
        // 하지만 차량은 항상 앞으로 가므로, 스티어링에 따라 시야각만 회전
        ctx.rotate(car.angle)
        
        // 차량 위치를 화면 좌표계로 변환
        // 차량은 항상 앞으로 가므로, Y축 방향으로 이동한 거리만큼 빼기
        ctx.translate(-car.x, -car.y)
        
        // 트랙 그리기 (1인칭 시점)
        drawTrackFirstPerson(ctx, canvas, car)
        
        // 브레이킹 포인트 표시 (1인칭 시점)
        drawBrakingPointFirstPerson(ctx, brakingPoint, car)
        
        // 거리 표시
        if (brakingStarted && brakingDistance) {
          const currentDistance = Math.sqrt(
            Math.pow(brakingPoint.x - car.x, 2) + 
            Math.pow(brakingPoint.y - car.y, 2)
          )
          drawDistanceFirstPerson(ctx, car, brakingPoint, currentDistance)
        }
        
        ctx.restore()
        
        // 차량 후드/HUD 오버레이 (1인칭 시점)
        drawHoodOverlay(ctx, canvas, car, brakingPoint)
      } else {
        // 3인칭 시점 렌더링 (기존 코드)
        ctx.save()
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2 + 50
        ctx.translate(centerX, centerY)
        ctx.transform(1, 0.3, 0, 0.7, 0, 0)
        ctx.translate(-centerX, -centerY)
        
        drawTrack(ctx, canvas)
        drawBrakingPoint(ctx, brakingPoint)
        drawCar(ctx, car)
        
        if (brakingStarted && brakingDistance) {
          const currentDistance = Math.sqrt(
            Math.pow(brakingPoint.x - car.x, 2) + 
            Math.pow(brakingPoint.y - car.y, 2)
          )
          drawDistance(ctx, car, brakingPoint, currentDistance)
        }
        
        ctx.restore()
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isTraining, car, brakingPoint, brakingStarted, brakingDistance, updatePhysics])

  const handleStart = () => {
    setIsTraining(true)
    setCar({
      x: 100,
      y: 400,
      angle: 0, // 1인칭 시점: 초기 각도는 0 (정면)
      speed: 0,
      acceleration: 0
    })
    setBrakingStarted(false)
    setBrakingDistance(null)
    setLastFeedback(null)
  }

  const handleReset = () => {
    setIsTraining(false)
    setCar({
      x: 100,
      y: 400,
      angle: 0,
      speed: 0,
      acceleration: 0
    })
    setBrakingStarted(false)
    setBrakingDistance(null)
  }

  return (
    <div className="space-y-6">
      {/* 장비 연결 상태 */}
      <div className={`p-4 rounded-xl border-2 ${
        gamepad.connected
          ? 'bg-green-900/20 border-green-800 text-green-300'
          : 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
      }`}>
        {gamepad.connected ? (
          <div className="flex items-center gap-2">
            <span>✅ 레이싱 장비 연결됨</span>
            <span className="text-xs">(키보드: ↑↓←→ 도 사용 가능)</span>
          </div>
        ) : (
          <div>
            <p>⚠️ 레이싱 장비가 연결되지 않았습니다</p>
            <p className="text-xs mt-1">키보드로 테스트: ↑(액셀) ↓(브레이크) ←→(스티어링)</p>
          </div>
        )}
      </div>

      {/* 시뮬레이터 */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">브레이킹 포인트 훈련</h3>
          <div className="flex items-center gap-4">
            {isTraining && (
              <button
                onClick={() => setViewMode(viewMode === 'first-person' ? 'third-person' : 'first-person')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors text-sm"
              >
                {viewMode === 'first-person' ? '👁️ 3인칭' : '🚗 1인칭'}
              </button>
            )}
            {!isTraining ? (
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold transition-colors"
              >
                시작
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                리셋
              </button>
            )}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="w-full border border-gray-700 rounded-lg bg-gray-950"
        />

        {/* 입력 게이지 */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">스로틀</div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-100"
                style={{ width: `${gamepad.throttle * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">브레이크</div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-100"
                style={{ width: `${gamepad.brake * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400 mb-1">스티어링</div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className="absolute top-0 bottom-0 w-1 bg-cyan-400 transition-all duration-100"
                style={{ left: `${(gamepad.steering + 1) * 50}%` }}
              />
            </div>
          </div>
          <div className="text-sm">
            <div className="text-gray-400">속도</div>
            <div className="text-white font-bold">{car.speed.toFixed(0)} km/h</div>
          </div>
        </div>

        {/* 피드백 */}
        {lastFeedback && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300">
            {lastFeedback}
          </div>
        )}

        {/* 통계 */}
        <div className="mt-4 text-sm text-gray-400">
          시도 횟수: <span className="text-white font-semibold">{attempts}</span>
        </div>
      </div>
    </div>
  )
}

// 1인칭 시점 변환 함수
function worldToScreen(x: number, y: number, carX: number, carY: number, carAngle: number, cameraDistance: number = 200) {
  // 월드 좌표를 차량 기준으로 변환
  const dx = x - carX
  const dy = y - carY
  
  // 차량 각도 기준으로 회전
  const cos = Math.cos(-carAngle)
  const sin = Math.sin(-carAngle)
  const rotatedX = dx * cos - dy * sin
  const rotatedY = dx * sin + dy * cos
  
  // 1인칭 시점으로 변환 (원근감)
  const scale = cameraDistance / (cameraDistance + rotatedY)
  const screenX = rotatedX * scale
  const screenY = rotatedY * scale
  
  return { x: screenX, y: screenY, scale }
}

// 렌더링 함수들 (3D 스타일 - 카트라이더)
function drawTrack(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const centerY = canvas.height / 2 + 50
  const startX = 50
  const endX = 700
  const trackDepth = 120 // 3D 깊이 (더 깊게)

  // 트랙 바닥 (3D 사다리꼴 - 더 명확한 깊이)
  const gradient = ctx.createLinearGradient(startX, centerY, endX + trackDepth, centerY + trackDepth * 2)
  gradient.addColorStop(0, '#2D3748') // 앞쪽 밝게
  gradient.addColorStop(1, '#1A202C') // 뒤쪽 어둡게
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(endX, centerY)
  ctx.lineTo(endX + trackDepth * 1.2, centerY + trackDepth * 2)
  ctx.lineTo(startX + trackDepth * 1.2, centerY + trackDepth * 2)
  ctx.closePath()
  ctx.fill()

  // 트랙 바닥 패턴 (격자 - 3D 효과)
  ctx.strokeStyle = 'rgba(17, 24, 39, 0.6)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 12; i++) {
    const x = startX + (endX - startX) * (i / 12)
    ctx.beginPath()
    ctx.moveTo(x, centerY)
    ctx.lineTo(x + trackDepth * 1.2, centerY + trackDepth * 2)
    ctx.stroke()
  }

  // 왼쪽 경계선 (앞쪽 - 밝게)
  ctx.strokeStyle = '#60A5FA'
  ctx.lineWidth = 5
  ctx.shadowBlur = 5
  ctx.shadowColor = '#60A5FA'
  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(endX, centerY)
  ctx.stroke()
  ctx.shadowBlur = 0

  // 왼쪽 경계선 (뒤쪽 - 어둡게)
  ctx.strokeStyle = '#3B82F6'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(startX + trackDepth * 1.2, centerY + trackDepth * 2)
  ctx.lineTo(endX + trackDepth * 1.2, centerY + trackDepth * 2)
  ctx.stroke()

  // 연결선 (3D 측면 - 깊이감)
  ctx.strokeStyle = '#4B5563'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(startX + trackDepth * 1.2, centerY + trackDepth * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(endX, centerY)
  ctx.lineTo(endX + trackDepth * 1.2, centerY + trackDepth * 2)
  ctx.stroke()

  // 트랙 중앙선 (3D - 황금색)
  ctx.strokeStyle = '#FCD34D'
  ctx.setLineDash([20, 20])
  ctx.lineWidth = 4
  ctx.shadowBlur = 3
  ctx.shadowColor = '#FCD34D'
  ctx.beginPath()
  ctx.moveTo(startX + trackDepth * 0.6, centerY + trackDepth)
  ctx.lineTo(endX + trackDepth * 0.6, centerY + trackDepth)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0

  // 코너 (3D 호 - 앞쪽)
  ctx.strokeStyle = '#60A5FA'
  ctx.lineWidth = 5
  ctx.shadowBlur = 5
  ctx.shadowColor = '#60A5FA'
  ctx.beginPath()
  ctx.arc(700, centerY, 200, 0, Math.PI / 2)
  ctx.stroke()
  ctx.shadowBlur = 0
  
  // 코너 뒤쪽 (3D)
  ctx.strokeStyle = '#3B82F6'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(700 + trackDepth * 1.2, centerY + trackDepth * 2, 200, 0, Math.PI / 2)
  ctx.stroke()
}

function drawBrakingPoint(ctx: CanvasRenderingContext2D, point: BrakingPoint) {
  // 3D 효과를 위한 그림자 (타원형)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.beginPath()
  ctx.ellipse(point.x + 5, point.y + 8, 18, 10, 0.3, 0, Math.PI * 2)
  ctx.fill()

  // 브레이킹 포인트 원기둥 바닥 (3D)
  ctx.fillStyle = '#DC2626'
  ctx.beginPath()
  ctx.ellipse(point.x, point.y + 5, 15, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  // 브레이킹 포인트 마커 (3D 그라데이션 원기둥)
  const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 15)
  gradient.addColorStop(0, '#FF8787')
  gradient.addColorStop(0.5, '#FF6B6B')
  gradient.addColorStop(1, '#EF4444')
  ctx.fillStyle = gradient
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3

  ctx.beginPath()
  ctx.arc(point.x, point.y, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // 상단 하이라이트 (3D 효과)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.beginPath()
  ctx.arc(point.x - 5, point.y - 5, 6, 0, Math.PI * 2)
  ctx.fill()

  // 거리 표시 (3D 효과 - 입체)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4
  ctx.strokeText(point.marker, point.x, point.y - 35)
  ctx.fillText(point.marker, point.x, point.y - 35)
  
  // 그림자 텍스트
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillText(point.marker, point.x + 2, point.y - 33)
}

function drawCar(ctx: CanvasRenderingContext2D, car: CarState) {
  ctx.save()
  ctx.translate(car.x, car.y)
  ctx.rotate(car.angle)

  // 차량 그림자 (3D 타원형)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.ellipse(8, 12, 20, 12, car.angle + 0.3, 0, Math.PI * 2)
  ctx.fill()

  // 차량 바닥 (3D 효과)
  ctx.fillStyle = '#1E3A8A'
  ctx.beginPath()
  ctx.moveTo(-15, 8)
  ctx.lineTo(15, 8)
  ctx.lineTo(12, 12)
  ctx.lineTo(-12, 12)
  ctx.closePath()
  ctx.fill()

  // 차량 측면 (3D 효과)
  ctx.fillStyle = '#3B82F6'
  ctx.beginPath()
  ctx.moveTo(-15, -8)
  ctx.lineTo(-12, 8)
  ctx.lineTo(-12, 12)
  ctx.lineTo(-15, 8)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(15, -8)
  ctx.lineTo(12, 8)
  ctx.lineTo(12, 12)
  ctx.lineTo(15, 8)
  ctx.closePath()
  ctx.fill()

  // 차량 상단 (3D 그라데이션)
  const carGradient = ctx.createLinearGradient(-15, -8, -15, 8)
  carGradient.addColorStop(0, '#93C5FD') // 상단 밝게
  carGradient.addColorStop(0.5, '#60A5FA') // 중간
  carGradient.addColorStop(1, '#3B82F6') // 하단 어둡게
  ctx.fillStyle = carGradient
  
  // 차량 모양 (사다리꼴로 3D 효과)
  ctx.beginPath()
  ctx.moveTo(-15, -8)
  ctx.lineTo(15, -8)
  ctx.lineTo(12, 8)
  ctx.lineTo(-12, 8)
  ctx.closePath()
  ctx.fill()

  // 차량 윤곽선
  ctx.strokeStyle = '#1E40AF'
  ctx.lineWidth = 2
  ctx.stroke()

  // 윈드실드 (3D 효과)
  ctx.fillStyle = 'rgba(200, 230, 255, 0.4)'
  ctx.fillRect(-10, -6, 8, 4)

  // 방향 표시 (전조등)
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowBlur = 10
  ctx.shadowColor = '#FFFFFF'
  ctx.fillRect(10, -3, 5, 6)
  ctx.shadowBlur = 0

  ctx.restore()
}

// 의사 3D 도로 렌더링 (Pseudo 3D Road Rendering)
interface RoadSegment {
  z: number // 거리 (깊이)
  y: number // 화면 Y 위치
  scale: number // 스케일
  width: number // 폭
}

function projectRoadSegment(z: number, cameraHeight: number, horizon: number, roadWidth: number): RoadSegment {
  // 원근 투영 계산
  const scale = cameraHeight / (cameraHeight + z)
  const y = horizon - z * scale
  const width = roadWidth * scale
  
  return { z, y, scale, width }
}

// 1인칭 시점 렌더링 함수들 (의사 3D - Pseudo 3D)
function drawTrackFirstPerson(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, car: CarState) {
  const centerX = 0 // 차량 위치 (변환 후)
  const horizon = -150 // 수평선 위치
  const cameraHeight = 200 // 카메라 높이
  const roadWidth = 200 // 실제 도로 폭
  const segmentLength = 5 // 세그먼트 길이
  const numSegments = 120 // 세그먼트 개수
  
  // 하늘/배경 그라데이션
  const skyGradient = ctx.createLinearGradient(0, -canvas.height, 0, horizon)
  skyGradient.addColorStop(0, '#4A90E2')
  skyGradient.addColorStop(0.5, '#87CEEB')
  skyGradient.addColorStop(1, '#E0F2FE')
  ctx.fillStyle = skyGradient
  ctx.fillRect(-canvas.width * 2, -canvas.height * 2, canvas.width * 4, canvas.height * 2 - horizon)
  
  // 지평선 그리기
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(-canvas.width, horizon)
  ctx.lineTo(canvas.width, horizon)
  ctx.stroke()
  
  // 도로 세그먼트 렌더링 (의사 3D)
  const segments: RoadSegment[] = []
  for (let i = 0; i < numSegments; i++) {
    const z = i * segmentLength
    segments.push(projectRoadSegment(z, cameraHeight, horizon, roadWidth))
  }
  
  // 도로 바닥 렌더링 (사다리꼴 스트립)
  for (let i = 0; i < segments.length - 1; i++) {
    const seg1 = segments[i]
    const seg2 = segments[i + 1]
    
    // 거리에 따른 색상 변화 (가까울수록 밝게)
    const brightness = Math.max(0.3, 1 - (seg1.z / (numSegments * segmentLength)))
    
    // 도로 바닥 색상
    ctx.fillStyle = `rgba(${Math.floor(31 * brightness)}, ${Math.floor(41 * brightness)}, ${Math.floor(55 * brightness)}, 0.9)`
    
    // 도로 세그먼트 그리기 (사다리꼴)
    ctx.beginPath()
    ctx.moveTo(centerX - seg1.width / 2, seg1.y)
    ctx.lineTo(centerX + seg1.width / 2, seg1.y)
    ctx.lineTo(centerX + seg2.width / 2, seg2.y)
    ctx.lineTo(centerX - seg2.width / 2, seg2.y)
    ctx.closePath()
    ctx.fill()
    
    // 도로 패턴 (격자선 효과)
    if (i % 3 === 0) {
      ctx.strokeStyle = `rgba(100, 100, 100, ${brightness * 0.3})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX - seg1.width / 2, seg1.y)
      ctx.lineTo(centerX - seg2.width / 2, seg2.y)
      ctx.moveTo(centerX + seg1.width / 2, seg1.y)
      ctx.lineTo(centerX + seg2.width / 2, seg2.y)
      ctx.stroke()
    }
  }
  
  // 왼쪽 경계선 (의사 3D)
  ctx.strokeStyle = '#60A5FA'
  ctx.lineWidth = 4
  ctx.shadowBlur = 5
  ctx.shadowColor = '#60A5FA'
  ctx.beginPath()
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const x = centerX - seg.width / 2
    if (i === 0) {
      ctx.moveTo(x, seg.y)
    } else {
      ctx.lineTo(x, seg.y)
    }
  }
  ctx.stroke()
  
  // 오른쪽 경계선 (의사 3D)
  ctx.beginPath()
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const x = centerX + seg.width / 2
    if (i === 0) {
      ctx.moveTo(x, seg.y)
    } else {
      ctx.lineTo(x, seg.y)
    }
  }
  ctx.stroke()
  ctx.shadowBlur = 0
  
  // 트랙 중앙선 (의사 3D - 점선)
  ctx.strokeStyle = '#FCD34D'
  ctx.setLineDash([20 * segments[0].scale, 20 * segments[0].scale])
  ctx.lineWidth = 3
  ctx.shadowBlur = 3
  ctx.shadowColor = '#FCD34D'
  ctx.beginPath()
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (i === 0) {
      ctx.moveTo(centerX, seg.y)
    } else {
      ctx.lineTo(centerX, seg.y)
    }
  }
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0
  
  // 측면 잔디/배경 (의사 3D)
  for (let i = 0; i < segments.length - 1; i++) {
    const seg1 = segments[i]
    const seg2 = segments[i + 1]
    
    // 왼쪽 잔디
    const grassBrightness = Math.max(0.2, 1 - (seg1.z / (numSegments * segmentLength)) * 0.5)
    ctx.fillStyle = `rgba(${Math.floor(34 * grassBrightness)}, ${Math.floor(139 * grassBrightness)}, ${Math.floor(34 * grassBrightness)}, 0.8)`
    ctx.beginPath()
    ctx.moveTo(-canvas.width, seg1.y)
    ctx.lineTo(-canvas.width, seg2.y)
    ctx.lineTo(centerX - seg2.width / 2, seg2.y)
    ctx.lineTo(centerX - seg1.width / 2, seg1.y)
    ctx.closePath()
    ctx.fill()
    
    // 오른쪽 잔디
    ctx.beginPath()
    ctx.moveTo(canvas.width, seg1.y)
    ctx.lineTo(canvas.width, seg2.y)
    ctx.lineTo(centerX + seg2.width / 2, seg2.y)
    ctx.lineTo(centerX + seg1.width / 2, seg1.y)
    ctx.closePath()
    ctx.fill()
  }
}

function drawBrakingPointFirstPerson(ctx: CanvasRenderingContext2D, point: BrakingPoint, car: CarState) {
  // 월드 좌표를 차량 기준으로 변환
  const dx = point.x - car.x
  const dy = point.y - car.y
  
  // 차량 각도 기준으로 회전 (1인칭 시점: 차량이 향하는 방향)
  // 차량은 항상 앞으로 가지만, 스티어링 각도에 따라 시야가 회전
  const cos = Math.cos(-car.angle)
  const sin = Math.sin(-car.angle)
  const rotatedX = dx * cos - dy * sin
  const rotatedY = dx * sin + dy * cos
  
  // 차량 뒤쪽이면 그리지 않음
  if (rotatedY < 0) return
  
  // 의사 3D 원근 투영 적용
  const horizon = -150
  const cameraHeight = 200
  const z = rotatedY // 거리 (깊이)
  const scale = cameraHeight / (cameraHeight + z)
  const screenX = rotatedX * scale
  const screenY = horizon - z * scale
  
  // 브레이킹 포인트 마커 (의사 3D - 원근감)
  const radius = 30 * scale
  const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius)
  gradient.addColorStop(0, '#FF8787')
  gradient.addColorStop(0.5, '#FF6B6B')
  gradient.addColorStop(1, '#EF4444')
  ctx.fillStyle = gradient
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3 * scale
  
  // 그림자 효과
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.ellipse(screenX + 3 * scale, screenY + 5 * scale, radius * 0.8, radius * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 브레이킹 포인트 원
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  
  // 하이라이트 (3D 효과)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.beginPath()
  ctx.arc(screenX - 8 * scale, screenY - 8 * scale, 8 * scale, 0, Math.PI * 2)
  ctx.fill()
  
  // 거리 표시 (의사 3D - 원근감)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${Math.max(16, 20 * scale)}px Arial`
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4 * scale
  ctx.strokeText(point.marker, screenX, screenY - radius - 25 * scale)
  ctx.fillText(point.marker, screenX, screenY - radius - 25 * scale)
}

function drawDistanceFirstPerson(ctx: CanvasRenderingContext2D, car: CarState, point: BrakingPoint, distance: number) {
  // 월드 좌표를 차량 기준으로 변환
  const dx = point.x - car.x
  const dy = point.y - car.y
  
  // 차량 각도 기준으로 회전
  const cos = Math.cos(-car.angle)
  const sin = Math.sin(-car.angle)
  const rotatedX = dx * cos - dy * sin
  const rotatedY = dx * sin + dy * cos
  
  // 차량 뒤쪽이면 그리지 않음
  if (rotatedY < 0) return
  
  // 의사 3D 원근 투영 적용
  const horizon = -150
  const cameraHeight = 200
  const z = rotatedY
  const scale = cameraHeight / (cameraHeight + z)
  const screenX = rotatedX * scale
  const screenY = horizon - z * scale
  
  // 차량 위치 (화면 하단 중앙)
  const carScreenY = 0 // 변환 후 차량 Y 위치
  
  // 거리 표시선 (의사 3D)
  ctx.strokeStyle = '#F59E0B'
  ctx.lineWidth = 2 * scale
  ctx.setLineDash([10 * scale, 10 * scale])
  ctx.shadowBlur = 3 * scale
  ctx.shadowColor = '#F59E0B'
  ctx.beginPath()
  ctx.moveTo(0, carScreenY) // 차량 위치 (화면 중앙 하단)
  ctx.lineTo(screenX, screenY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0
  
  // 거리 텍스트 (의사 3D - 원근감)
  ctx.fillStyle = '#F59E0B'
  ctx.font = `bold ${Math.max(14, 18 * scale)}px Arial`
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 4 * scale
  ctx.strokeText(`${Math.round(distance)}m`, screenX, screenY - 30 * scale)
  ctx.fillText(`${Math.round(distance)}m`, screenX, screenY - 30 * scale)
}

function drawHoodOverlay(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, car: CarState, brakingPoint: BrakingPoint) {
  // 차량 후드/HUD 오버레이 (1인칭 시점)
  const hoodHeight = 150
  
  // 후드 그라데이션
  const hoodGradient = ctx.createLinearGradient(0, canvas.height - hoodHeight, 0, canvas.height)
  hoodGradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  hoodGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)')
  hoodGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
  ctx.fillStyle = hoodGradient
  ctx.fillRect(0, canvas.height - hoodHeight, canvas.width, hoodHeight)
  
  // 후드 경계선
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, canvas.height - hoodHeight)
  ctx.lineTo(canvas.width, canvas.height - hoodHeight)
  ctx.stroke()
  
  // 속도계 HUD (왼쪽 하단)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(20, canvas.height - 100, 140, 80)
  ctx.strokeStyle = '#60A5FA'
  ctx.lineWidth = 2
  ctx.strokeRect(20, canvas.height - 100, 140, 80)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('SPEED', 30, canvas.height - 75)
  
  ctx.fillStyle = '#60A5FA'
  ctx.font = 'bold 32px Arial'
  ctx.fillText(Math.round(car.speed).toString(), 30, canvas.height - 50)
  
  ctx.fillStyle = '#9CA3AF'
  ctx.font = 'bold 14px Arial'
  ctx.fillText('km/h', 30, canvas.height - 30)
  
  // 브레이킹 포인트 거리 (오른쪽 하단)
  const distance = Math.sqrt(
    Math.pow(brakingPoint.x - car.x, 2) + 
    Math.pow(brakingPoint.y - car.y, 2)
  )
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(canvas.width - 160, canvas.height - 100, 140, 80)
  ctx.strokeStyle = '#EF4444'
  ctx.lineWidth = 2
  ctx.strokeRect(canvas.width - 160, canvas.height - 100, 140, 80)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('DISTANCE', canvas.width - 150, canvas.height - 75)
  
  ctx.fillStyle = '#EF4444'
  ctx.font = 'bold 32px Arial'
  ctx.fillText(Math.round(distance).toString(), canvas.width - 150, canvas.height - 50)
  
  ctx.fillStyle = '#9CA3AF'
  ctx.font = 'bold 14px Arial'
  ctx.fillText('px', canvas.width - 150, canvas.height - 30)
}

