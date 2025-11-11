'use client'

import { useState } from 'react'
import type { BopAlert } from '@/lib/iracingTypes'

interface BopAlertsCardProps {
  initialSeriesId?: number
}

export default function BopAlertsCard({ initialSeriesId }: BopAlertsCardProps) {
  const [seriesId, setSeriesId] = useState<string>(initialSeriesId?.toString() || '')
  const [threshold, setThreshold] = useState<number>(20)
  const [alerts, setAlerts] = useState<BopAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        threshold: threshold.toString(),
      })
      if (seriesId) {
        params.append('series_id', seriesId)
      }

      const res = await fetch(`/api/iracing/meta/bop-alerts?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '알림 조회 실패')
      }

      setAlerts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '에러 발생')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 필터 섹션 */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 backdrop-blur-sm">
        <div className="text-sm font-semibold text-gray-300 mb-4">BoP 패치 알림</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">시리즈 ID (선택)</label>
            <input
              type="number"
              value={seriesId}
              onChange={(e) => setSeriesId(e.target.value)}
              placeholder="예: 123"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">임계값 (%)</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 20)}
              placeholder="20"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="w-full px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '조회 중...' : '알림 조회'}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-xl p-3">
            {error}
          </div>
        )}
      </div>

      {/* 알림 리스트 */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 animate-pulse">
              <div className="h-6 bg-gray-800 rounded mb-3"></div>
              <div className="h-4 bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={`${alert.car_id}-${alert.series_id}-${index}`}
              className={`bg-gray-900/60 border rounded-2xl p-5 backdrop-blur-sm ${
                alert.alert_type === 'surge'
                  ? 'border-emerald-600/50 bg-emerald-900/10'
                  : 'border-red-600/50 bg-red-900/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      alert.alert_type === 'surge'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-600/30'
                        : 'bg-red-600/20 text-red-300 border border-red-600/30'
                    }`}
                  >
                    {alert.alert_type === 'surge' ? '📈 급상승' : '📉 급하락'}
                  </div>
                  <h3 className="font-bold text-lg text-white">{alert.car_name}</h3>
                </div>
                <div className="text-xs text-gray-400">
                  {alert.series_name}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-400 mb-1">승률 변화</div>
                  <div
                    className={`text-lg font-bold ${
                      alert.win_rate_change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {alert.win_rate_change >= 0 ? '+' : ''}
                    {alert.win_rate_change.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">픽률 변화</div>
                  <div
                    className={`text-lg font-bold ${
                      alert.pick_rate_change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {alert.pick_rate_change >= 0 ? '+' : ''}
                    {alert.pick_rate_change.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Top 5율 변화</div>
                  <div
                    className={`text-lg font-bold ${
                      alert.top5_rate_change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {alert.top5_rate_change >= 0 ? '+' : ''}
                    {alert.top5_rate_change.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                패치 날짜: {new Date(alert.patch_date).toLocaleDateString('ko-KR')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && alerts.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-900/60 border border-gray-800 rounded-2xl">
          <div className="text-6xl mb-4 opacity-50">⚡</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">알림이 없습니다</h3>
          <p className="text-gray-500">
            현재 임계값({threshold}%) 이상의 급격한 변화를 보인 차량이 없습니다.
          </p>
        </div>
      )}
    </div>
  )
}
