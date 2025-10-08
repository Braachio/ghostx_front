'use client'

import { useEffect, useState } from 'react'
import { fetchBrakingLeaderboard, getScoreColor, type Leaderboard } from '@/lib/dashboardApi'

interface LeaderboardProps {
  track: string
}

export default function Leaderboard({ track }: LeaderboardProps) {
  const [data, setData] = useState<Leaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!track) return
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await fetchBrakingLeaderboard(track)
        setData(result)
      } catch (err) {
        console.error('리더보드 데이터 로드 실패:', err)
        // 테스트용 더미 데이터 설정
        setData({
          track: track,
          leaderboard: [
            {
              driver_id: 'user-123',
              lap_id: 'lap-001',
              corner_index: 0,
              segment_name: '코너 1',
              brake_peak: 78.5,
              decel_avg: 13.2,
              trail_braking_ratio: 0.52,
              abs_on_ratio: 0.12,
              performance_score: 85.3,
              created_at: new Date().toISOString()
            },
            {
              driver_id: 'user-456',
              lap_id: 'lap-002',
              corner_index: 0,
              segment_name: '코너 1',
              brake_peak: 76.2,
              decel_avg: 12.8,
              trail_braking_ratio: 0.48,
              abs_on_ratio: 0.15,
              performance_score: 82.7,
              created_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
              driver_id: 'user-789',
              lap_id: 'lap-003',
              corner_index: 0,
              segment_name: '코너 1',
              brake_peak: 74.8,
              decel_avg: 12.1,
              trail_braking_ratio: 0.45,
              abs_on_ratio: 0.18,
              performance_score: 80.1,
              created_at: new Date(Date.now() - 172800000).toISOString()
            }
          ],
          statistics: {
            total_samples: 15,
            brake_peak: {
              average: 75.2,
              min: 68.5,
              max: 82.3
            },
            deceleration: {
              average: 12.5,
              min: 10.8,
              max: 14.2
            },
            trail_braking: {
              average_usage: 0.45,
              max_usage: 0.65
            },
            abs_usage: {
              average_usage: 0.15,
              max_usage: 0.35
            }
          },
          best_practices: [
            {
              practice: '브레이킹 강도',
              recommended_value: 75.2,
              description: '상위 성능자들의 평균 브레이킹 강도는 75.2%입니다.'
            },
            {
              practice: '트레일 브레이킹',
              recommended_value: 0.45,
              description: '트레일 브레이킹 사용률은 0.45가 효과적입니다.'
            },
            {
              practice: 'ABS 사용',
              recommended_value: 0.15,
              description: 'ABS 사용률은 0.15 이하로 유지하는 것이 좋습니다.'
            }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [track])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">리더보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">
          <i className="fas fa-exclamation-triangle text-2xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">오류 발생</h3>
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">리더보드 데이터 없음</h3>
        <p className="text-gray-600">선택한 트랙의 리더보드 데이터가 없습니다.</p>
      </div>
    )
  }

  const leaderboard = data.leaderboard
  const statistics = data.statistics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">리더보드</h2>
        <p className="text-gray-600">다른 드라이버들과의 성능을 비교해보세요.</p>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-users text-3xl text-blue-500"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">총 참가자</p>
              <p className="text-gray-900 text-2xl font-bold">{statistics.total_samples}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-gauge text-3xl text-green-500"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">평균 브레이킹 강도</p>
              <p className="text-gray-900 text-2xl font-bold">{(statistics?.brake_peak?.average || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-chart-line text-3xl text-purple-500"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">평균 감속률</p>
              <p className="text-gray-900 text-2xl font-bold">{(statistics?.deceleration?.average || 0).toFixed(1)} m/s²</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-star text-3xl text-yellow-500"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">베스트 프랙티스</p>
              <p className="text-gray-900 text-2xl font-bold">{data.best_practices?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            <i className="fas fa-trophy mr-2"></i>브레이킹 리더보드 - {track}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">드라이버</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">코너</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">브레이킹 강도</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">감속률</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">트레일 브레이킹</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">성능 점수</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 ? (
                        <i className={`fas fa-medal text-${index === 0 ? 'yellow' : index === 1 ? 'gray' : 'orange'}-500 mr-2`}></i>
                      ) : (
                        <span className="text-gray-500 font-medium">{index + 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.driver_id || 'Anonymous'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.segment_name || `코너 ${entry.corner_index + 1}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(entry.brake_peak || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(entry.decel_avg || 0).toFixed(1)} m/s²
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((entry.trail_braking_ratio || 0) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(entry.performance_score)}`}>
                      {(entry.performance_score || 0).toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practices */}
      {data.best_practices && data.best_practices.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-star mr-2"></i>베스트 프랙티스
          </h3>
          <div className="space-y-3">
            {data.best_practices.map((practice, index) => (
              <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <h4 className="font-semibold text-gray-900">{practice.practice}</h4>
                <p className="text-sm text-gray-600 mt-1">{practice.description}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">{practice.recommended_value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-chart-bar mr-2"></i>상세 통계
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">브레이킹 강도</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">평균</span>
                <span className="font-semibold">{(statistics?.brake_peak?.average || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최소</span>
                <span className="font-semibold">{(statistics?.brake_peak?.min || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최대</span>
                <span className="font-semibold">{(statistics?.brake_peak?.max || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">감속률</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">평균</span>
                <span className="font-semibold">{(statistics?.deceleration?.average || 0).toFixed(1)} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최소</span>
                <span className="font-semibold">{(statistics?.deceleration?.min || 0).toFixed(1)} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최대</span>
                <span className="font-semibold">{(statistics?.deceleration?.max || 0).toFixed(1)} m/s²</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
