'use client'

import { useEffect, useState } from 'react'

interface TrackHistory {
  trackName: string
  lastUsed: {
    week: number
    year: number
    carClass: string
  }
}

interface TrackHistoryPanelProps {
  gameName: string
}

export default function TrackHistoryPanel({ gameName }: TrackHistoryPanelProps) {
  const [trackHistory, setTrackHistory] = useState<TrackHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrackHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('트랙 히스토리 요청:', gameName)
        
        const response = await fetch(`/api/track-history?game=${encodeURIComponent(gameName)}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('트랙 히스토리 응답:', data)
        
        setTrackHistory(data.data || [])
      } catch (err) {
        console.error('Failed to fetch track history:', err)
        setError(err instanceof Error ? err.message : '트랙 히스토리를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchTrackHistory()
  }, [gameName])


  const getTimeAgoText = (week: number, year: number) => {
    const now = new Date()
    const currentWeek = getWeekNumber(now)
    const currentYear = now.getFullYear()
    
    const weeksDiff = (currentYear - year) * 52 + (currentWeek - week)
    
    if (weeksDiff === 0) return '이번 주'
    if (weeksDiff === 1) return '지난 주'
    if (weeksDiff < 4) return `${weeksDiff}주 전`
    if (weeksDiff < 52) return `${Math.floor(weeksDiff / 4)}개월 전`
    return `${Math.floor(weeksDiff / 52)}년 전`
  }

  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1)
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil((days + start.getDay() + 1) / 7)
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">📊 트랙 히스토리</h3>
        <p className="text-gray-400">트랙 히스토리를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">📊 트랙 히스토리</h3>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <p className="text-red-300 text-sm">
            트랙 히스토리를 불러오는 데 실패했습니다.
          </p>
          <p className="text-red-400 text-xs mt-1">{error}</p>
          <button
            onClick={fetchTrackHistory}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">📊 트랙 히스토리</h3>
      
      {trackHistory.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📈</div>
          <p className="text-gray-400">아직 사용된 트랙이 없습니다.</p>
          <p className="text-gray-500 text-sm mt-2">정기 이벤트가 진행되면 트랙 히스토리가 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trackHistory.slice(0, 10).map((history, index) => (
            <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">{history.trackName}</h4>
                  <p className="text-gray-400 text-sm">
                    {history.lastUsed.carClass} • {getTimeAgoText(history.lastUsed.week, history.lastUsed.year)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">
                    {history.lastUsed.year}년 {history.lastUsed.week}주차
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {trackHistory.length > 10 && (
            <p className="text-gray-500 text-sm text-center mt-4">
              총 {trackHistory.length}개의 트랙 중 최근 10개 표시
            </p>
          )}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-gray-500 text-xs">
          💡 정기 멀티 이벤트에서 투표로 선택된 트랙들의 히스토리를 보여줍니다.
        </p>
      </div>
    </div>
  )
}