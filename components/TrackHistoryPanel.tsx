'use client'

import { useEffect, useState } from 'react'

interface TrackRecord {
  id: string
  selected_track: string
  selected_car_class: string
  week_number: number
  year: number
  created_at: string
  game_name: string
  standardized_track_name: string
  multis: {
    title: string
    game: string
    multi_day: string[]
  }
}

interface Recommendation {
  track: string
  carClass: string
  game: string
  dayOfWeek: string[]
  lastPlayed: string
  playCount: number
  weeksSinceLastPlay: number
  recommendation: string
}

interface TrackHistoryData {
  gameName: string
  trackHistory: TrackRecord[]
  recommendations: Recommendation[]
  summary: {
    totalTracks: number
    totalPlays: number
    mostPlayedTrack: {
      track: string
      count: number
    } | null
  }
}

interface TrackHistoryPanelProps {
  gameName: string
}

export default function TrackHistoryPanel({ gameName }: TrackHistoryPanelProps) {
  const [data, setData] = useState<TrackHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrackHistory = async () => {
      try {
        console.log('트랙 히스토리 요청:', { gameName, encodedUrl: `/api/track-history/${encodeURIComponent(gameName)}` })
        const response = await fetch(`/api/track-history/${encodeURIComponent(gameName)}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error('트랙 히스토리 API 에러:', { 
            status: response.status, 
            statusText: response.statusText, 
            errorText,
            gameName 
          })
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const trackData: TrackHistoryData = await response.json()
        console.log('트랙 히스토리 데이터 수신:', trackData)
        setData(trackData)
      } catch (err) {
        console.error('Failed to fetch track history:', err)
        setError('트랙 히스토리를 불러오는 데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchTrackHistory()
  }, [gameName])

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-2xl">📊</span> {gameName} 트랙 히스토리
        </h3>
        <p className="text-gray-400 text-center py-8">트랙 히스토리를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <span className="text-2xl">📊</span> {gameName} 트랙 히스토리
        </h3>
        <p className="text-red-400 text-center py-8">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">📊</span> {gameName} 트랙 히스토리
      </h3>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">{data.summary.totalTracks}</div>
          <div className="text-xs text-gray-400">총 트랙</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">{data.summary.totalPlays}</div>
          <div className="text-xs text-gray-400">진행 횟수</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {data.summary.mostPlayedTrack ? data.summary.mostPlayedTrack.count : 0}
          </div>
          <div className="text-xs text-gray-400">최다 플레이</div>
        </div>
      </div>

      {/* 트랙별 최근 진행일 */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">📍 트랙별 최근 진행일</h4>
        {data.recommendations && data.recommendations.length > 0 ? (
          <ul className="space-y-2">
            {data.recommendations.slice(0, 5).map((rec, index) => (
              <li key={rec.track} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-purple-400">{index + 1}.</span>
                  <div>
                    <span className="text-sm text-white font-semibold">{rec.track}</span>
                    <div className="text-xs text-gray-400">
                      {rec.playCount}회 진행 | {rec.weeksSinceLastPlay}주 전
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    rec.weeksSinceLastPlay >= 4 ? 'bg-green-900/30 text-green-300' :
                    rec.weeksSinceLastPlay >= 2 ? 'bg-yellow-900/30 text-yellow-300' :
                    'bg-red-900/30 text-red-300'
                  }`}>
                    {rec.recommendation}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-400 text-sm mb-1">아직 트랙 히스토리가 없습니다</p>
            <p className="text-gray-500 text-xs">정기 멀티에서 투표를 진행하면 통계가 표시됩니다</p>
          </div>
        )}
      </div>

      {/* 최근 투표 결과 */}
      {data.trackHistory && data.trackHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-300 mb-3">🗳️ 최근 투표 결과</h4>
          <ul className="space-y-2">
            {data.trackHistory.slice(0, 3).map((record) => (
              <li key={record.id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-semibold text-white text-sm">{record.standardized_track_name}</div>
                  <div className="text-xs text-gray-400">
                    {record.year}년 {record.week_number}주차
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {record.selected_car_class} | {record.multis.multi_day.join(', ')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
