'use client'

import { useState } from 'react'
import type { MetaVehicleStats } from '@/lib/iracingTypes'
import VehicleStatsCard from './VehicleStatsCard'

interface MetaVehicleReportProps {
  initialSeriesId?: number
}

export default function MetaVehicleReport({ initialSeriesId }: MetaVehicleReportProps) {
  const [seriesId, setSeriesId] = useState<string>(initialSeriesId?.toString() || '')
  const [trackId, setTrackId] = useState<string>('')
  const [periodDays, setPeriodDays] = useState<number>(7)
  const [stats, setStats] = useState<MetaVehicleStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockLoading, setMockLoading] = useState(false)

  const fetchReport = async () => {
    if (!seriesId) {
      setError('시리즈 ID를 입력해주세요')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        series_id: seriesId,
        period_days: periodDays.toString(),
      })
      if (trackId) {
        params.append('track_id', trackId)
      }

      const res = await fetch(`/api/iracing/meta/report?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '리포트 조회 실패')
      }

      setStats(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '에러 발생')
      setStats([])
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = async (count: number = 20) => {
    setMockLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        count: count.toString(),
      })
      if (seriesId) {
        params.append('series_id', seriesId)
      }

      const res = await fetch(`/api/iracing/meta/mock?${params.toString()}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Mock 데이터 생성 실패')
      }

      // 더 나은 알림 메시지
      const seriesNames = (data.series as Array<{ id: number; name: string }>).map(s => s.name).join(', ')
      const message = `✅ Mock 데이터 생성 완료!\n\n생성된 세션: ${data.collected}개\n시리즈: ${seriesNames}\n\n이제 리포트를 조회할 수 있습니다.`
      
      alert(message)
      
      // 데이터 생성 후 자동으로 리포트 조회
      if (seriesId) {
        await fetchReport()
      } else {
        // 시리즈 ID가 없으면 첫 번째 시리즈 ID로 설정하고 조회
        if (data.series && data.series.length > 0) {
          setSeriesId(data.series[0].id.toString())
          await new Promise(resolve => setTimeout(resolve, 500)) // 상태 업데이트 대기
          await fetchReport()
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '에러 발생')
    } finally {
      setMockLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 필터 섹션 */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-300">메타 리포트 필터</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generateMockData(10)}
              disabled={mockLoading}
              className="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title="10개 세션 생성"
            >
              {mockLoading ? '생성 중...' : 'Mock 10개'}
            </button>
            <button
              onClick={() => generateMockData(20)}
              disabled={mockLoading}
              className="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title="20개 세션 생성"
            >
              {mockLoading ? '생성 중...' : 'Mock 20개'}
            </button>
            <button
              onClick={() => generateMockData(50)}
              disabled={mockLoading}
              className="px-3 py-1.5 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              title="50개 세션 생성"
            >
              {mockLoading ? '생성 중...' : 'Mock 50개'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">시리즈 ID</label>
            <input
              type="number"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              placeholder="예: 123"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">트랙 ID (선택)</label>
            <input
              type="number"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              placeholder="예: 456"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">기간 (일)</label>
            <select
              value={periodDays}
              onChange={(e) => setPeriodDays(parseInt(e.target.value))}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value={7}>7일</option>
              <option value={14}>14일</option>
              <option value={30}>30일</option>
              <option value={60}>60일</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading || !seriesId}
              className="w-full px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-3">
            {error}
          </div>
        )}
      </div>

      {/* 결과 섹션 */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 animate-pulse">
              <div className="h-6 bg-gray-800 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && stats.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-lg font-semibold text-white">
              차량별 통계 ({stats.length}개)
            </div>
            {stats[0]?.series_name && (
              <div className="text-sm text-gray-400">
                {stats[0].series_name}
                {stats[0].track_name && ` • ${stats[0].track_name}`}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <VehicleStatsCard key={`${stat.car_id}-${stat.series_id}`} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {!loading && stats.length === 0 && !error && seriesId && (
        <div className="text-center py-12 bg-gray-900/60 border border-gray-800 rounded-2xl">
          <div className="text-6xl mb-4 opacity-50">📊</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">데이터가 없습니다</h3>
          <p className="text-gray-500">
            해당 조건에 맞는 메타 데이터가 없습니다. &quot;🧪 Mock 데이터 생성&quot; 버튼을 눌러 테스트 데이터를 생성해보세요.
          </p>
        </div>
      )}
    </div>
  )
}
