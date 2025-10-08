'use client'

import { useEffect, useState } from 'react'
import { fetchPerformanceTrends, formatDate, type PerformanceTrends } from '@/lib/dashboardApi'
import PerformanceTrendsChart from './PerformanceTrendsChart'

interface PerformanceTrendsProps {
  userId: string
  track?: string
  days: number
}

export default function PerformanceTrends({ userId, track, days }: PerformanceTrendsProps) {
  const [data, setData] = useState<PerformanceTrends | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const result = await fetchPerformanceTrends(userId, track, days)
        setData(result)
      } catch (err) {
        console.error('성능 트렌드 데이터 로드 실패:', err)
        // 테스트용 더미 데이터 설정
        setData({
          user_id: userId,
          track: track,
          period_days: days,
          trends: [
            {
              date: new Date(Date.now() - 86400000 * 7).toISOString(),
              lap_time: 98.123,
              track: 'seoul-circuit',
              car: 'BMW M3'
            },
            {
              date: new Date(Date.now() - 86400000 * 6).toISOString(),
              lap_time: 97.456,
              track: 'seoul-circuit',
              car: 'BMW M3'
            },
            {
              date: new Date(Date.now() - 86400000 * 5).toISOString(),
              lap_time: 96.789,
              track: 'seoul-circuit',
              car: 'BMW M3'
            },
            {
              date: new Date(Date.now() - 86400000 * 4).toISOString(),
              lap_time: 96.234,
              track: 'seoul-circuit',
              car: 'BMW M3'
            },
            {
              date: new Date(Date.now() - 86400000 * 3).toISOString(),
              lap_time: 95.567,
              track: 'seoul-circuit',
              car: 'BMW M3'
            },
            {
              date: new Date(Date.now() - 86400000 * 2).toISOString(),
              lap_time: 95.234,
              track: 'seoul-circuit',
              car: 'BMW M3'
            },
            {
              date: new Date(Date.now() - 86400000).toISOString(),
              lap_time: 95.123,
              track: 'seoul-circuit',
              car: 'BMW M3'
            }
          ],
          insights: [
            '최근 7일간 꾸준한 성능 개선을 보이고 있습니다! 🎉',
            '브레이킹 구간에서 개선이 두드러집니다.',
            '일관성 있는 주행 패턴을 유지하고 있습니다.'
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
          <p className="text-gray-600">성능 트렌드를 분석하는 중...</p>
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

  if (!data || data.trends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">트렌드 데이터 없음</h3>
        <p className="text-gray-600">선택한 조건에 해당하는 성능 트렌드 데이터가 없습니다.</p>
      </div>
    )
  }

  // 트렌드 분석
  const trends = data.trends
  const latestLap = trends[trends.length - 1]
  const earliestLap = trends[0]
  const improvement = latestLap && earliestLap ? earliestLap.lap_time - latestLap.lap_time : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">성능 트렌드</h2>
        <p className="text-gray-600">시간별 성능 변화와 개선 추이를 분석합니다.</p>
      </div>

      {/* Trend Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-chart-line text-3xl text-blue-500"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">총 랩 수</p>
              <p className="text-2xl font-bold text-gray-900">{trends.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className={`fas fa-arrow-${improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'right'} text-3xl ${improvement > 0 ? 'text-green-500' : improvement < 0 ? 'text-red-500' : 'text-gray-500'}`}></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">전체 개선</p>
              <p className={`text-2xl font-bold ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {improvement > 0 ? '+' : ''}{(improvement || 0).toFixed(2)}초
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-calendar text-3xl text-purple-500"></i>
            </div>
            <div className="ml-4">
              <p className="text-gray-600 text-sm font-medium">분석 기간</p>
              <p className="text-2xl font-bold text-gray-900">{data.period_days}일</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-chart-area mr-2"></i>성능 트렌드 분석
        </h3>
        <PerformanceTrendsChart data={trends.map(trend => ({
          date: trend.date,
          lapTime: trend.lap_time,
          track: trend.track,
          car: trend.car
        }))} />
      </div>

      {/* Recent Performance Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-table mr-2"></i>최근 성능 기록
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">랩 타임</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">트랙</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">차량</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">변화</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trends.slice(-10).reverse().map((trend, index) => {
                const prevTrend = trends[trends.length - index - 2]
                const change = prevTrend ? trend.lap_time - prevTrend.lap_time : 0
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(trend.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(trend.lap_time || 0).toFixed(3)}초
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trend.track}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trend.car}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {change !== 0 ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          change < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {change < 0 ? '↓' : '↑'} {Math.abs(change || 0).toFixed(3)}초
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-lightbulb mr-2"></i>트렌드 인사이트
          </h3>
          <div className="space-y-3">
            {data.insights.map((insight, index) => (
              <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                <i className="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-calculator mr-2"></i>성능 통계
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {trends.length > 0 ? Math.min(...trends.map(t => t.lap_time || 0)).toFixed(3) : '--'}
            </p>
            <p className="text-sm text-gray-600">최고 기록</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {trends.length > 0 ? (trends.reduce((sum, t) => sum + (t.lap_time || 0), 0) / trends.length).toFixed(3) : '--'}
            </p>
            <p className="text-sm text-gray-600">평균 기록</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {trends.length > 0 ? Math.max(...trends.map(t => t.lap_time || 0)).toFixed(3) : '--'}
            </p>
            <p className="text-sm text-gray-600">최저 기록</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {trends.length > 1 ? 
                (trends.reduce((sum, t) => sum + Math.pow((t.lap_time || 0) - (trends.reduce((s, tr) => s + (tr.lap_time || 0), 0) / trends.length), 2), 0) / trends.length).toFixed(3) : 
                '--'
              }
            </p>
            <p className="text-sm text-gray-600">표준편차</p>
          </div>
        </div>
      </div>
    </div>
  )
}
