'use client'

import { useState } from 'react'

export default function CleanupEventsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ updatedCount?: number; error?: string } | null>(null)

  const runCleanup = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/multis/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult(data)
    } catch {
      setResult({ error: '정리 작업 실행 중 오류 발생' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          🧹 이벤트 상태 정리
        </h1>
        
        <div className="space-y-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-white">정리 작업 설명</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• <strong className="text-cyan-400">자동 실행:</strong> 이벤트 목록을 볼 때마다 자동으로 실행됩니다</li>
              <li>• <strong className="text-orange-400">수동 실행:</strong> 아래 버튼으로 언제든 수동 실행 가능합니다</li>
              <li>• <strong className="text-red-400">정리 대상:</strong> 이벤트 종료 시간이 현재 시간보다 이전인 이벤트</li>
              <li>• <strong className="text-green-400">종료 시간:</strong> 이벤트 시작 시간 + 2시간 (또는 해당 날짜 23:59)</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={runCleanup}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '🧹 정리 중...' : '🧹 수동 정리 실행'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 font-semibold"
            >
              🔄 새로고침
            </button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.error 
                ? 'bg-red-900/20 border-red-500/30 text-red-300'
                : 'bg-green-900/20 border-green-500/30 text-green-300'
            }`}>
              <h3 className="font-semibold mb-2">
                {result.error ? '❌ 오류 발생' : '✅ 정리 완료'}
              </h3>
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-300">💡 참고사항</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• 정리 작업은 데이터베이스의 `is_open` 상태만 변경합니다</li>
              <li>• 이벤트 데이터 자체는 삭제되지 않습니다</li>
              <li>• 과거 이벤트도 기록으로 남아있어 언제든 조회 가능합니다</li>
              <li>• 정기 멀티의 경우 다음 주차로 자동 생성되지 않습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
