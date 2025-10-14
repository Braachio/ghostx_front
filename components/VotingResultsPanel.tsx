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
  const [applying, setApplying] = useState(false)
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

  const applyResults = async () => {
    if (!results) return
    
    setApplying(true)
    setError('')
    try {
      const response = await fetch(`/api/regular-events/${eventId}/apply-voting-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week_number: results.week_number,
          year: results.year
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`투표 결과가 적용되었습니다!\n\n🏁 트랙: ${data.results.winningTrack} (${data.results.trackVotes}표)\n🚗 클래스: ${data.results.winningCarClass} (${data.results.carClassVotes}표)`)
        await fetchResults() // 결과 새로고침
      } else {
        const errorData = await response.json()
        setError(errorData.error || '투표 결과 적용에 실패했습니다.')
      }
    } catch (err) {
      console.error('투표 결과 적용 실패:', err)
      setError('투표 결과 적용 중 오류가 발생했습니다.')
    } finally {
      setApplying(false)
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
        <h3 className="text-xl font-bold text-white mb-4">🏆 투표 결과</h3>
        <div className="text-gray-400 text-center py-4">투표 결과를 불러오는 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🏆 투표 결과</h3>
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
        <h3 className="text-xl font-bold text-white mb-4">🏆 투표 결과</h3>
        <div className="text-gray-400 text-center py-4">
          {currentYear}년 {currentWeek}주차 투표 결과가 없습니다.
        </div>
      </div>
    )
  }

  // const winningTrack = results.tracks[0]
  // const winningCarClass = results.carClasses[0]

  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">🏆 투표 결과</h3>
        <div className="text-sm text-gray-400">
          {results.year}년 {results.week_number}주차
        </div>
      </div>

      <div className="space-y-6">
        {/* 트랙 투표 결과 */}
        <div>
          <h4 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            🏁 트랙 투표 결과
          </h4>
          <div className="space-y-2">
            {results.tracks.map((track, index) => (
              <div
                key={track.option_value}
                className={`p-3 rounded-lg border ${
                  index === 0
                    ? 'bg-green-900/20 border-green-500/30 text-green-300'
                    : 'bg-gray-700/30 border-gray-600 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {index === 0 && '🥇 '}{track.option_value}
                  </span>
                  <span className="text-sm">
                    {track.votes_count}표
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 차량 클래스 투표 결과 */}
        <div>
          <h4 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
            🚗 차량 클래스 투표 결과
          </h4>
          <div className="space-y-2">
            {results.carClasses.map((carClass, index) => (
              <div
                key={carClass.option_value}
                className={`p-3 rounded-lg border ${
                  index === 0
                    ? 'bg-green-900/20 border-green-500/30 text-green-300'
                    : 'bg-gray-700/30 border-gray-600 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {index === 0 && '🥇 '}{carClass.option_value}
                  </span>
                  <span className="text-sm">
                    {carClass.votes_count}표
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 투표 결과 적용 버튼 */}
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={applyResults}
            disabled={applying}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
          >
            {applying ? '적용 중...' : '🏆 투표 결과를 이벤트에 적용하기'}
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            승리한 트랙과 차량 클래스가 정기 이벤트의 TBD 부분에 자동으로 입력됩니다
          </p>
        </div>
      </div>
    </div>
  )
}
