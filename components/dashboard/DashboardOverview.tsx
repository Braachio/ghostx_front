'use client'

import { useEffect, useState } from 'react'
import { fetchDashboardOverview, formatLapTime, formatDate, type DashboardOverview } from '@/lib/dashboardApi'
import LapTimeChart from './LapTimeChart'

interface DashboardOverviewProps {
  userId: string
  track?: string
  days: number
}

export default function DashboardOverview({ userId, track, days }: DashboardOverviewProps) {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await fetchDashboardOverview(userId, track, days)
        setData(result)
      } catch (err) {
        console.error('대시보드 데이터 로드 실패:', err)
        // 테스트용 더미 데이터 설정
        setData({
          user_id: userId,
          track: track,
          period_days: days,
          total_laps: 5,
          summary: {
            best_lap_time: 95.234,
            average_lap_time: 97.456,
            improvement_trend: 1.2,
            total_distance: 1500.0
          },
          recent_laps: [
            {
              lap_id: 'lap-001',
              track: 'seoul-circuit',
              car: 'BMW M3',
              lap_time: 95.234,
              created_at: new Date().toISOString(),
              sector_count: 8,
              sectors: []
            },
            {
              lap_id: 'lap-002',
              track: 'seoul-circuit',
              car: 'BMW M3',
              lap_time: 96.123,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              sector_count: 8,
              sectors: []
            }
          ],
          performance_metrics: {
            consistency_score: 85.2,
            improvement_rate: 3.1,
            best_sector_times: []
          },
          track_leaderboard: [
            {
              user_id: 'user-123',
              lap_time: 95.234,
              car: 'BMW M3',
              created_at: new Date().toISOString()
            },
            {
              user_id: 'user-456',
              lap_time: 95.456,
              car: 'Audi RS3',
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ]
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, track, days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 없음</h3>
        <p className="text-gray-600">선택한 조건에 해당하는 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">대시보드 개요</h2>
        <p className="text-gray-600">최근 주행 성능과 핵심 지표를 확인하세요.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-stopwatch text-3xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-blue-100 text-sm font-medium">최고 랩 타임</p>
              <p className="text-2xl font-bold">
                {data.summary?.best_lap_time ? formatLapTime(data.summary.best_lap_time) : '--'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-chart-line text-3xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-green-100 text-sm font-medium">평균 랩 타임</p>
              <p className="text-2xl font-bold">
                {data.summary?.average_lap_time ? formatLapTime(data.summary.average_lap_time) : '--'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-trending-up text-3xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-purple-100 text-sm font-medium">개선 트렌드</p>
              <p className="text-2xl font-bold">
                {data.summary?.improvement_trend !== null && data.summary?.improvement_trend !== undefined ? 
                  `${data.summary.improvement_trend > 0 ? '+' : ''}${data.summary.improvement_trend.toFixed(2)}초` : 
                  '--'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-flag-checkered text-3xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-orange-100 text-sm font-medium">총 랩 수</p>
              <p className="text-2xl font-bold">{data.total_laps}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-chart-pie mr-2"></i>성능 지표
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">일관성 점수</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${data.performance_metrics?.consistency_score || 0}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">
                  {(data.performance_metrics?.consistency_score || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">개선율</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(Math.max(data.performance_metrics?.improvement_rate || 0, 0), 100)}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">
                  {(data.performance_metrics?.improvement_rate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-list mr-2"></i>최근 랩
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recent_laps.length > 0 ? (
              data.recent_laps.map((lap) => (
                <div key={lap.lap_id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{lap.track}</h4>
                      <p className="text-sm text-gray-600">{lap.car}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">{formatLapTime(lap.lap_time)}</p>
                      <p className="text-xs text-gray-500">{formatDate(lap.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span><i className="fas fa-flag mr-1"></i>{lap.sector_count} 섹터</span>
                    {lap.weather && <span><i className="fas fa-cloud mr-1"></i>{lap.weather}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-car text-4xl mb-4"></i>
                <p>최근 랩 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lap Time Chart */}
      {data.recent_laps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-chart-line mr-2"></i>최근 랩 타임 추이
          </h3>
          <LapTimeChart 
            data={data.recent_laps.map((lap, index) => ({
              lap: `랩 ${data.recent_laps.length - index}`,
              lapTime: lap.lap_time,
              date: lap.created_at
            })).reverse()}
          />
        </div>
      )}

      {/* Track Leaderboard */}
      {data.track_leaderboard.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-trophy mr-2"></i>트랙 리더보드
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">드라이버</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">랩 타임</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.track_leaderboard.slice(0, 10).map((entry, index) => (
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
                      {entry.user_id || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLapTime(entry.lap_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.car || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
