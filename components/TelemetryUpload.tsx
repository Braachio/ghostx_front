'use client'

import { useState } from 'react'
import TelemetrySessionList from './TelemetrySessionList'
import TelemetryVisualization from './TelemetryVisualization'
// import TrainingModal from './training/TrainingModal' // 나중에 구현
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'

export default function TelemetryUpload() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  // const [showTrainingModal, setShowTrainingModal] = useState(false) // 나중에 구현

  if (!TELEMETRY_ENABLED) {
    return (
      <div className="rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/10 p-8 text-center text-cyan-200">
        {TELEMETRY_DISABLED_MESSAGE}
      </div>
    )
  }

  const handleMockDataGeneration = async (duration: number) => {
    setLoading(true)
    setMessage('Mock 데이터 생성 중...')
    try {
      const res = await fetch(`/api/iracing/telemetry/mock?duration=${duration}&sample_rate=60`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '생성 실패')
      setMessage(`✅ Mock 데이터 생성 완료! 세션 ID: ${data.session_id}, 샘플: ${data.samples_inserted}개`)
      // 생성 후 세션 선택 및 목록 새로고침
      setSelectedSessionId(data.session_id)
      setRefreshKey(prev => prev + 1)
    } catch (e) {
      setMessage(`❌ 오류: ${e instanceof Error ? e.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* 메시지 */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.startsWith('✅')
              ? 'bg-green-900/20 border border-green-800 text-green-300'
              : message.startsWith('❌')
              ? 'bg-red-900/20 border border-red-800 text-red-300'
              : 'bg-blue-900/20 border border-blue-800 text-blue-300'
          }`}
        >
          {message}
        </div>
      )}

      {/* iRacing SDK 실시간 데이터 수집 섹션 */}
      <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500 rounded-2xl p-8 backdrop-blur-sm shadow-lg shadow-cyan-500/20">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl">
              🚀
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-2xl font-bold text-white">iRacing SDK 실시간 데이터 수집</h3>
              <span className="px-3 py-1 bg-cyan-600/30 border border-cyan-500/50 rounded-lg text-xs font-semibold text-cyan-300">
                주요 기능
              </span>
            </div>
            <p className="text-base text-gray-200 mb-6">
              iRacing 구독자 전용: 주행 중 실시간으로 텔레메트리 데이터를 자동 수집하고 분석합니다.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                  <span>📊</span> 실시간 데이터 수집
                </h4>
                <p className="text-xs text-gray-400">
                  60Hz 주파수로 속도, RPM, 기어, 페달 입력, 타이어 온도, G-Force 등 모든 데이터를 수집합니다.
                </p>
              </div>
              <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                  <span>💾</span> 자동 저장 및 업로드
                </h4>
                <p className="text-xs text-gray-400">
                  수집된 데이터는 자동으로 서버에 저장되어 언제든지 분석할 수 있습니다.
                </p>
              </div>
              <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                  <span>🎮</span> 플러그 앤 플레이
                </h4>
                <p className="text-xs text-gray-400">
                  iRacing을 실행하고 수집 스크립트만 실행하면 됩니다. 추가 설정 불필요.
                </p>
              </div>
              <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                  <span>📈</span> 즉시 분석 가능
                </h4>
                <p className="text-xs text-gray-400">
                  주행이 끝나면 바로 세션 목록에서 확인하고 전문적인 시각화로 분석하세요.
                </p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 mb-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>⚙️</span> 사용 방법
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-1">FastAPI 서버 실행</p>
                    <code className="block bg-gray-800 px-3 py-2 rounded text-xs text-cyan-300 font-mono">
                      cd ghostx_fastapi && python main.py
                    </code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-1">iRacing 실행 및 레이싱 시작</p>
                    <p className="text-xs text-gray-400">iRacing에서 원하는 트랙/카로 레이싱을 시작하세요.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-1">데이터 수집 스크립트 실행</p>
                    <code className="block bg-gray-800 px-3 py-2 rounded text-xs text-cyan-300 font-mono">
                      cd ghostx_fastapi && python services/iracing_sdk_collector.py
                    </code>
                    <p className="text-xs text-gray-400 mt-1">스크립트가 자동으로 iRacing 연결을 감지하고 데이터 수집을 시작합니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-bold text-white">4</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-1">주행 완료 후 자동 저장</p>
                    <p className="text-xs text-gray-400">세션이 끝나면 자동으로 데이터가 저장되고, 이 페이지에서 바로 확인할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>💡</span>
              <p>
                <strong className="text-cyan-400">팁:</strong> 수집 스크립트는 iRacing이 실행 중일 때만 작동합니다. 
                레이싱 중에 백그라운드로 실행해두면 자동으로 모든 데이터를 수집합니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mock 데이터 생성 섹션 (테스트용) */}
      <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">🧪 Mock 텔레메트리 데이터 생성</h3>
            <p className="text-sm text-gray-300 mb-4">
              테스트용 Mock 텔레메트리 데이터를 생성하여 UI를 테스트할 수 있습니다.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMockDataGeneration(60)}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '생성 중...' : 'Mock 데이터 생성 (60초)'}
              </button>
              <button
                onClick={() => handleMockDataGeneration(120)}
                disabled={loading}
                className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '생성 중...' : 'Mock 데이터 생성 (120초)'}
              </button>
            </div>
          </div>
          <div className="px-4 py-2 bg-purple-600/20 border border-purple-600/30 rounded-xl text-xs text-purple-300">
            테스트용
          </div>
        </div>
      </div>


      {/* AI 훈련 모듈 - 나중에 구현 */}
      {/* <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">🎮 AI 교정 훈련</h3>
            <p className="text-sm text-gray-300 mb-4">
              실제 레이싱 장비로 브레이킹 포인트를 정확히 맞추는 근육 기억을 훈련하세요.
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• 레이싱 휠/페달 자동 감지</p>
              <p>• 브레이킹 포인트 정확도 측정</p>
              <p>• 반복 훈련으로 근육 기억 교정</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-purple-600/20 border border-purple-600/30 rounded-xl text-xs text-purple-300">
            신규
          </div>
        </div>
        <button
          onClick={() => setShowTrainingModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-colors text-white"
        >
          AI 훈련 시작
        </button>
      </div> */}

      {/* 세션 목록 및 시각화 */}
      <div className="space-y-8">
        {/* 세션 목록 - 상단에 컴팩트하게 배치 */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">📋 텔레메트리 세션 목록</h3>
          <TelemetrySessionList
            key={refreshKey}
            onSessionSelect={setSelectedSessionId}
            selectedSessionId={selectedSessionId}
          />
        </div>

        {/* 시각화 영역 - 전체 폭 사용 */}
        <div className="min-h-[800px]">
          {selectedSessionId ? (
            <TelemetryVisualization sessionId={selectedSessionId} />
          ) : (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center min-h-[600px] flex flex-col items-center justify-center">
              <div className="text-6xl mb-4 opacity-50">📊</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">세션을 선택하세요</h3>
              <p className="text-gray-500">위에서 텔레메트리 세션을 선택하면 전문적인 시각화가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* AI 훈련 모달 - 나중에 구현 */}
      {/* <TrainingModal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
      /> */}
    </div>
  )
}



