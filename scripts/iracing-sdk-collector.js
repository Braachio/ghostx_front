/**
 * iRacing SDK 텔레메트리 데이터 수집 서비스
 * 
 * 사용법:
 * 1. npm install mmap-io (또는 irsdk 패키지)
 * 2. node scripts/iracing-sdk-collector.js
 * 
 * 환경 변수:
 * - API_URL: 서버 API URL (기본값: http://localhost:3000)
 * - USER_TOKEN: Supabase 인증 토큰 (선택사항, 브라우저에서 로그인 후 토큰 입력)
 */

const os = require('os')
const fs = require('fs')
const path = require('path')

// Windows 공유 메모리 접근을 위한 패키지 (설치 필요: npm install mmap-io)
let mmap
try {
  mmap = require('mmap-io')
} catch (e) {
  console.error('❌ mmap-io 패키지가 설치되지 않았습니다.')
  console.error('설치: npm install mmap-io')
  process.exit(1)
}

const API_URL = process.env.API_URL || 'http://localhost:3000'
const COLLECTION_INTERVAL = 60 // 60Hz (초당 60회)
const BATCH_SIZE = 60 // 1초치 데이터를 배치로 전송

// iRacing SDK 공유 메모리 파일 경로 (Windows)
const SHARED_MEMORY_FILE = 'Local\\IRSDKMemMapFileName'

class IRacingSDKCollector {
  constructor() {
    this.isRunning = false
    this.sessionId = null
    this.sessionStartTime = null
    this.samples = []
    this.lastUploadTime = Date.now()
    this.userToken = process.env.USER_TOKEN || null
  }

  /**
   * iRacing SDK 공유 메모리에서 데이터 읽기
   */
  readSDKData() {
    try {
      // Windows 공유 메모리 매핑
      // 실제 구현은 mmap-io 또는 node-irsdk 패키지 사용 필요
      // 여기서는 구조만 보여줌
      
      // 공유 메모리 구조:
      // - Header (버전, 상태 등)
      // - Variables (속도, RPM, 스로틀 등)
      // - Buffers (텔레메트리 샘플)
      
      // 실제 구현 예시:
      // const memMap = mmap.mapFile(SHARED_MEMORY_FILE, ...)
      // const header = memMap.readStruct(IRSDKHeader)
      // const variables = memMap.readStruct(IRSDKVariables)
      
      return {
        connected: true,
        sessionTime: 0,
        speed: 0,
        rpm: 0,
        throttle: 0,
        brake: 0,
        steering: 0,
        gear: 0,
        // ... 기타 필드
      }
    } catch (error) {
      return { connected: false, error: error.message }
    }
  }

  /**
   * 샘플 데이터를 TelemetrySample 형식으로 변환
   */
  convertToTelemetrySample(sdkData, elapsedTime) {
    return {
      elapsed_time: elapsedTime,
      
      // 제어 입력
      throttle_position: sdkData.throttle / 100.0, // 0-100% → 0.0-1.0
      brake_position: sdkData.brake / 100.0,
      steering_angle: sdkData.steering, // 라디안 또는 도
      
      // 차량 상태
      speed_ms: sdkData.speed * 0.44704, // mph → m/s
      speed_kmh: sdkData.speed * 1.60934, // mph → km/h
      rpm: sdkData.rpm,
      gear: sdkData.gear,
      
      // 위치 (SDK에서 제공하는 경우)
      position_x: sdkData.posX || null,
      position_y: sdkData.posY || null,
      position_z: sdkData.posZ || null,
      heading: sdkData.heading || null,
      distance_lap: sdkData.lapDist || null,
      
      // 타이어 (SDK에서 제공하는 경우)
      tire_temp_fl: sdkData.lfTemp || null,
      tire_temp_fr: sdkData.rfTemp || null,
      tire_temp_rl: sdkData.lrTemp || null,
      tire_temp_rr: sdkData.rrTemp || null,
      
      // G-Force
      g_force_lateral: sdkData.latG || null,
      g_force_longitudinal: sdkData.longG || null,
      
      // 기타
      lap_number: sdkData.lap || null,
      fuel_level: sdkData.fuelLevel || null,
    }
  }

  /**
   * 서버로 데이터 전송
   */
  async uploadSamples(samples) {
    if (samples.length === 0) return

    try {
      const sessionData = this.readSDKData()
      if (!sessionData.connected) {
        console.log('⚠️ iRacing이 실행되지 않았습니다.')
        return
      }

      const uploadRequest = {
        session: {
          user_id: 'current_user', // 실제로는 토큰에서 추출
          session_name: `iRacing Session ${new Date().toISOString()}`,
          track_id: sessionData.trackId || null,
          track_name: sessionData.trackName || null,
          car_id: sessionData.carId || null,
          car_name: sessionData.carName || null,
          session_type: 'practice', // SDK에서 세션 타입 확인 필요
          start_time: this.sessionStartTime.toISOString(),
          end_time: new Date().toISOString(),
        },
        samples,
      }

      const headers = {
        'Content-Type': 'application/json',
      }

      if (this.userToken) {
        headers['Authorization'] = `Bearer ${this.userToken}`
      }

      const response = await fetch(`${API_URL}/api/iracing/telemetry/upload`, {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadRequest),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${samples.length}개 샘플 업로드 완료 (Session ID: ${data.session_id})`)
      } else {
        const error = await response.json()
        console.error(`❌ 업로드 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('❌ 업로드 중 오류:', error.message)
    }
  }

  /**
   * 수집 시작
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ 이미 수집 중입니다.')
      return
    }

    console.log('🚀 iRacing SDK 텔레메트리 수집 시작...')
    this.isRunning = true
    this.sessionStartTime = new Date()
    this.samples = []

    const collectInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(collectInterval)
        return
      }

      const sdkData = this.readSDKData()
      
      if (!sdkData.connected) {
        console.log('⚠️ iRacing 연결 끊김, 수집 중지')
        this.stop()
        return
      }

      // 샘플 생성
      const elapsedTime = (Date.now() - this.sessionStartTime.getTime()) / 1000
      const sample = this.convertToTelemetrySample(sdkData, elapsedTime)
      this.samples.push(sample)

      // 배치 크기에 도달하면 업로드
      if (this.samples.length >= BATCH_SIZE) {
        const batch = [...this.samples]
        this.samples = []
        await this.uploadSamples(batch)
      }

      // 10초마다 강제 업로드 (세션 종료 대비)
      if (Date.now() - this.lastUploadTime > 10000 && this.samples.length > 0) {
        const batch = [...this.samples]
        this.samples = []
        await this.uploadSamples(batch)
        this.lastUploadTime = Date.now()
      }
    }, 1000 / COLLECTION_INTERVAL) // 60Hz
  }

  /**
   * 수집 중지
   */
  async stop() {
    if (!this.isRunning) return

    console.log('🛑 수집 중지 중...')
    this.isRunning = false

    // 남은 샘플 업로드
    if (this.samples.length > 0) {
      await this.uploadSamples(this.samples)
      this.samples = []
    }

    console.log('✅ 수집 완료')
  }
}

// CLI 실행
if (require.main === module) {
  const collector = new IRacingSDKCollector()

  // 시작
  collector.start()

  // 종료 처리
  process.on('SIGINT', async () => {
    console.log('\n종료 중...')
    await collector.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await collector.stop()
    process.exit(0)
  })
}

module.exports = IRacingSDKCollector

