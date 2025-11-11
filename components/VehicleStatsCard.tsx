'use client'

import type { MetaVehicleStats } from '@/lib/iracingTypes'

interface VehicleStatsCardProps {
  stat: MetaVehicleStats
}

export default function VehicleStatsCard({ stat }: VehicleStatsCardProps) {
  const getWinRateColor = (rate: number) => {
    if (rate >= 30) return 'from-emerald-500 to-green-600'
    if (rate >= 20) return 'from-cyan-500 to-blue-600'
    if (rate >= 10) return 'from-yellow-500 to-orange-600'
    return 'from-gray-500 to-gray-600'
  }

  const getPickRateColor = (rate: number) => {
    if (rate >= 30) return 'bg-purple-600/20 border-purple-600/30 text-purple-300'
    if (rate >= 20) return 'bg-blue-600/20 border-blue-600/30 text-blue-300'
    if (rate >= 10) return 'bg-cyan-600/20 border-cyan-600/30 text-cyan-300'
    return 'bg-gray-600/20 border-gray-600/30 text-gray-300'
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors backdrop-blur-sm">
      {/* 차량 이름 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-white truncate flex-1 pr-2">
          {stat.car_name}
        </h3>
        <div className={`px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${getWinRateColor(stat.win_rate)}`}>
          {stat.win_rate.toFixed(1)}%
        </div>
      </div>

      {/* 주요 통계 */}
      <div className="space-y-3">
        {/* 승률 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">승률</span>
            <span className="text-sm font-semibold text-white">
              {stat.wins}승 / {stat.total_races}경기
            </span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getWinRateColor(stat.win_rate)} transition-all`}
              style={{ width: `${Math.min(100, stat.win_rate)}%` }}
            />
          </div>
        </div>

        {/* Top 5율 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Top 5 완주율</span>
            <span className="text-sm font-semibold text-white">{stat.top5_rate.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
              style={{ width: `${Math.min(100, stat.top5_rate)}%` }}
            />
          </div>
        </div>

        {/* 픽률 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">픽률</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPickRateColor(stat.pick_rate)}`}>
              {stat.pick_rate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="pt-3 border-t border-gray-800 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-400 mb-1">총 참여자</div>
            <div className="font-semibold text-white">{stat.total_participants.toLocaleString()}</div>
          </div>
          {stat.avg_lap_time && (
            <div>
              <div className="text-gray-400 mb-1">평균 랩타임</div>
              <div className="font-semibold text-white">
                {formatLapTime(stat.avg_lap_time)}
              </div>
            </div>
          )}
        </div>

        {/* iRating 구간별 통계 (트랙이 지정된 경우에만 표시) */}
        {stat.track_id && stat.track_name && stat.irating_bins && Object.keys(stat.irating_bins).length > 0 && (
          <div className="pt-3 border-t border-gray-800">
            <div className="text-xs text-gray-400 mb-1">iRating 구간별 랩타임</div>
            <div className="text-xs text-cyan-400 mb-2 font-medium">
              🏁 {stat.track_name}
            </div>
            <div className="space-y-1.5">
              {Object.entries(stat.irating_bins)
                .sort(([a], [b]) => {
                  // 숫자로 정렬 (예: "2000-2100" -> 2000)
                  const numA = parseInt(a.split('-')[0])
                  const numB = parseInt(b.split('-')[0])
                  return numA - numB
                })
                .slice(0, 3)
                .map(([bin, data]) => (
                  <div key={bin} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{bin} iR</span>
                    <span className="text-white font-semibold">
                      {formatLapTime(data.avg_lap_time)}
                      <span className="text-gray-500 ml-1">({data.count})</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatLapTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}
