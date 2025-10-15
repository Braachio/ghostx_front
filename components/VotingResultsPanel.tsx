'use client'

import { useState, useEffect } from 'react'

interface VotingResults {
  tracks: Array<{ option_value: string; votes_count: number }>
  carClasses: Array<{ option_value: string; votes_count: number }>
  week_number: number
  year: number
}

interface VotingResultsPanelProps {
  eventId: string
}

export default function VotingResultsPanel({ eventId }: VotingResultsPanelProps) {
  const [results, setResults] = useState<VotingResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 현재 주차 정보 계산
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentWeek = Math.ceil((((+currentDate - +new Date(currentYear, 0, 1)) / 86400000) + new Date(currentYear, 0, 1).getDay() + 1) / 7)

  const fetchResults = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/regular-events/${eventId}/apply-voting-results?week_number=${currentWeek}&year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
      } else {
        const errorData = await response.json()
        setError(errorData.error || '투표 결과를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('투표 결과 조회 실패:', err)
      setError('투표 결과 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    // 지연 실행으로 초기화 문제 방지
    const timer = setTimeout(() => {
      fetchResults()
    }, 100)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, currentWeek, currentYear])

  if (loading) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">투표 결과</h3>
        <div className="text-gray-400 text-center py-4">투표 결과를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">투표 결과</h3>
        <div className="text-red-400 text-center py-4">{error}</div>
        <button
          onClick={fetchResults}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!results || (results.tracks.length === 0 && results.carClasses.length === 0)) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">투표 결과</h3>
        <div className="text-gray-400 text-center py-4">
          {currentYear}년 {currentWeek}주차 투표 결과가 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">투표 결과</h3>
        <div className="text-sm text-gray-400">
          {results.year}년 {results.week_number}주차
        </div>
      </div>

      <div className="text-center py-4">
        <div className="text-sm text-gray-400 mb-2">
          투표가 종료되면 승리한 트랙과 차량 클래스가 자동으로 이벤트에 적용됩니다.
        </div>
        <div className="text-xs text-gray-500">
          🏁 트랙: {results.tracks.length > 0 ? results.tracks[0].option_value : 'N/A'} ({results.tracks.length > 0 ? results.tracks[0].votes_count : 0}표)
        </div>
        <div className="text-xs text-gray-500">
          🚗 클래스: {results.carClasses.length > 0 ? results.carClasses[0].option_value : 'N/A'} ({results.carClasses.length > 0 ? results.carClasses[0].votes_count : 0}표)
        </div>
      </div>
    </div>
  )
}
