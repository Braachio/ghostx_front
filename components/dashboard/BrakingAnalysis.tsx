'use client'

import { useEffect, useState } from 'react'
import { fetchDashboardOverview, fetchBrakingAnalysis, formatLapTime, getInsightClass, getInsightIcon, type BrakingAnalysis } from '@/lib/dashboardApi'

// BrakingZone 타입 정의
type BrakingZone = {
  id: string;
  corner_index: number;
  segment_name: string;
  start_time: number;
  end_time: number;
  start_distance?: number;
  end_distance?: number;
  duration?: number;
  brake_peak: number;
  decel_avg: number;
  trail_braking_ratio: number;
  abs_on_ratio: number;
  slip_lock_ratio_front: number;
  slip_lock_ratio_rear: number;
}
import BrakingChart from './BrakingChart'

interface BrakingAnalysisProps {
  userId: string
  track?: string
  days: number
}

// 더미 데이터 생성 함수
function getDummyBrakingData(): BrakingAnalysis {
  return {
    lap_id: 'lap-001',
    track: 'seoul-circuit',
    meta: {
      track: 'seoul-circuit',
      car: 'BMW M3',
      lap_time: 95.234,
      created_at: new Date().toISOString(),
      weather: 'sunny',
      air_temp: 25,
      track_temp: 30
    },
    braking_analysis: {
      summary: {
        total_brake_zones: 8,
        average_brake_peak: 75.2,
        average_deceleration: 12.5,
        trail_braking_usage: 0.45,
        abs_usage: 0.15
      },
      visualization: {
        brake_zones: [
          {
            id: 'brake_zone_0',
            corner_index: 0,
            segment_name: '코너 1',
            start_time: 5.2,
            end_time: 8.1,
            start_distance: 100.0,
            end_distance: 150.0,
            duration: 2.9,
            brake_peak: 78.5,
            decel_avg: 13.2,
            trail_braking_ratio: 0.52,
            abs_on_ratio: 0.12,
            slip_lock_ratio_front: 0.05,
            slip_lock_ratio_rear: 0.03
          },
          {
            id: 'brake_zone_1',
            corner_index: 1,
            segment_name: '코너 2',
            start_time: 15.8,
            end_time: 18.3,
            start_distance: 300.0,
            end_distance: 350.0,
            duration: 2.5,
            brake_peak: 72.1,
            decel_avg: 11.8,
            trail_braking_ratio: 0.38,
            abs_on_ratio: 0.18,
            slip_lock_ratio_front: 0.08,
            slip_lock_ratio_rear: 0.04
          }
        ],
        performance_metrics: [
          {
            corner_index: 0,
            brake_efficiency: 85.3,
            smoothness_score: 78.9,
            aggressiveness_score: 72.1
          },
          {
            corner_index: 1,
            brake_efficiency: 82.7,
            smoothness_score: 75.4,
            aggressiveness_score: 68.9
          }
        ],
        corner_analysis: [
          {
            corner_index: 0,
            segment_name: '코너 1',
            strengths: ['트레일 브레이킹 활용', '부드러운 브레이킹'],
            weaknesses: [],
            improvement_areas: ['현재 패턴 유지']
          },
          {
            corner_index: 1,
            segment_name: '코너 2',
            strengths: ['확실한 제동'],
            weaknesses: ['ABS 사용률 높음'],
            improvement_areas: ['더 부드러운 브레이킹']
          }
        ]
      },
      feedbacks: [
        '코너 1: 브레이킹 타이밍이 빠른 랩들과 유사합니다.',
        '코너 2: ABS 사용률을 줄이면 더 빠른 진입이 가능합니다.'
      ],
      overall_score: 82.1
    },
    comparison: {
      benchmark_data: [
        {
          corner_index: 0,
          segment_name: '코너 1',
          your_brake_peak: 78.5,
          benchmark_brake_peak: 76.2,
          your_decel: 13.2,
          benchmark_decel: 12.8,
          performance_vs_benchmark: 'above_average'
        }
      ],
      comparison_metrics: {
        overall_performance: 'above_average',
        improvement_potential: 15.2,
        strengths: ['트레일 브레이킹', '일관성'],
        weaknesses: ['ABS 사용률']
      }
    },
    insights: [
      {
        type: 'success',
        title: '트레일 브레이킹 활용',
        message: '트레일 브레이킹을 잘 활용하고 있습니다!',
        priority: 'low'
      },
      {
        type: 'warning',
        title: 'ABS 사용률 높음',
        message: '코너 2에서 ABS 사용률이 높습니다. 더 부드러운 브레이킹을 시도해보세요.',
        priority: 'medium'
      }
    ]
  }
}

export default function BrakingAnalysis({ userId, track, days }: BrakingAnalysisProps) {
  const [data, setData] = useState<BrakingAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return
      
      setLoading(true)
      setError(null)
      
      try {
        // 최근 랩을 가져와서 선택한 트랙에 맞는 랩 선택
        const overviewData = await fetchDashboardOverview(userId, track, days)
        let targetLap = overviewData.recent_laps && overviewData.recent_laps[0]
        if (track) {
          const filtered = (overviewData.recent_laps || []).filter(l => l.track === track)
          if (filtered.length > 0) targetLap = filtered[0]
        }
        if (targetLap) {
          
          // Check if this is a real UUID or dummy data
          const isRealLapId = targetLap.lap_id && targetLap.lap_id.includes('-') && targetLap.lap_id.length > 20
          
          if (isRealLapId) {
            const brakingData = await fetchBrakingAnalysis(targetLap.lap_id)
            setData(brakingData)
          } else {
            // Use dummy data for non-UUID lap IDs
            console.log('Using dummy data for braking analysis (non-UUID lap_id)')
            setData(getDummyBrakingData())
          }
        } else {
          setData(null)
        }
      } catch (err) {
        console.error('브레이킹 분석 데이터 로드 실패:', err)
        // 테스트용 더미 데이터 설정
        setData(getDummyBrakingData())
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, track, days])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>
  }

  const analysis = data?.braking_analysis
  const summary = (analysis?.summary || {}) as {
    total_brake_zones?: number;
    average_brake_peak?: number;
    average_deceleration?: number;
    trail_braking_usage?: number;
    abs_usage?: number;
  }
  const visualization = (analysis?.visualization || {}) as {
    brake_zones?: BrakingZone[];
    performance_metrics?: Array<{
      corner_index: number;
      brake_efficiency: number;
      smoothness_score: number;
      aggressiveness_score: number;
    }>;
    corner_analysis?: Array<{
      corner_index: number;
      segment_name: string;
      strengths: string[];
      weaknesses: string[];
      improvement_areas: string[];
    }>;
  }
  const brakeZones = (visualization?.brake_zones || []) as BrakingZone[]
  const insights = data?.insights || []

  if (!analysis || brakeZones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <i className="fas fa-car-crash text-4xl mb-4"></i>
        <p>선택한 조건에 해당하는 브레이킹 분석 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Braking Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-car-crash text-3xl text-red-500"></i>
          </div>
          <div className="ml-4">
            <p className="text-gray-600 text-sm font-medium">총 브레이킹 존</p>
            <p className="text-gray-900 text-2xl font-bold">{summary.total_brake_zones || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-gauge text-3xl text-blue-500"></i>
          </div>
          <div className="ml-4">
            <p className="text-gray-600 text-sm font-medium">평균 브레이킹 강도</p>
            <p className="text-gray-900 text-2xl font-bold">{(summary?.average_brake_peak || 0).toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-chart-line text-3xl text-green-500"></i>
          </div>
          <div className="ml-4">
            <p className="text-gray-600 text-sm font-medium">트레일 브레이킹</p>
            <p className="text-gray-900 text-2xl font-bold">{((summary?.trail_braking_usage || 0) * 100).toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
          <div className="flex-shrink-0">
            <i className="fas fa-star text-3xl text-yellow-500"></i>
          </div>
          <div className="ml-4">
            <p className="text-gray-600 text-sm font-medium">전체 점수</p>
            <p className="text-gray-900 text-2xl font-bold">{(analysis?.overall_score || 0).toFixed(1)}/100</p>
          </div>
        </div>
      </div>

      {/* Braking Zone Detail Analysis */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-list mr-2"></i>브레이킹 존 분석
        </h3>
        <div className="space-y-4">
          {brakeZones.map((zone: BrakingZone) => (
            <div key={zone.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {zone.segment_name || `코너 ${zone.corner_index + 1}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatLapTime(zone.start_time)} - {formatLapTime(zone.end_time)}
                    <span className="ml-2">({(zone.duration || 0).toFixed(2)}초)</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{(zone.brake_peak || 0).toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">브레이킹 강도</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">감속률</p>
                  <p className="font-semibold">{(zone.decel_avg || 0).toFixed(1)} m/s²</p>
                </div>
                <div>
                  <p className="text-gray-600">트레일 브레이킹</p>
                  <p className="font-semibold">{((zone.trail_braking_ratio || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">ABS 사용</p>
                  <p className="font-semibold">{((zone.abs_on_ratio || 0) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">프론트 슬립</p>
                  <p className="font-semibold">{((zone.slip_lock_ratio_front || 0) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Braking Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-chart-line mr-2"></i>브레이킹 성능 차트
        </h3>
        <BrakingChart data={brakeZones} />
      </div>

      {/* Benchmark Comparison */}
      {data.comparison?.benchmark_data && data.comparison.benchmark_data.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-chart-bar mr-2"></i>벤치마크 비교
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코너
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    내 브레이킹 강도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    벤치마크
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성능
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.comparison.benchmark_data.map((benchmark, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {benchmark.segment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(benchmark.your_brake_peak || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(benchmark.benchmark_brake_peak || 0).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        benchmark.performance_vs_benchmark === 'above_average' ? 'bg-green-100 text-green-800' :
                        benchmark.performance_vs_benchmark === 'below_average' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {benchmark.performance_vs_benchmark === 'above_average' ? '평균 이상' :
                         benchmark.performance_vs_benchmark === 'below_average' ? '평균 이하' : '평균'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-lightbulb mr-2"></i>브레이킹 인사이트
          </h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`flex items-start p-3 rounded-lg ${getInsightClass(insight.type)}`}>
                <i className={`${getInsightIcon(insight.type)} mt-1 mr-3`}></i>
                <div>
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}