'use client'

import { useEffect, useState } from 'react'

interface VoteOption {
  id: string
  option_type: 'track' | 'car_class'
  option_value: string
  votes_count: number
  voting_closed: boolean
  week_number: number
  year: number
}

interface VoteOptionsManagerProps {
  eventId: string
  weekNumber?: number
  year?: number
  isAuthor: boolean
}

export default function VoteOptionsManager({ 
  eventId, 
  weekNumber, 
  year, 
  isAuthor 
}: VoteOptionsManagerProps) {
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newOptionType, setNewOptionType] = useState<'track' | 'car_class'>('track')
  const [newOptionValue, setNewOptionValue] = useState('')
  const [addingOption, setAddingOption] = useState(false)

  const currentWeek = weekNumber || getCurrentWeek()
  const currentYear = year || new Date().getFullYear()

  useEffect(() => {
    const fetchVoteOptions = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/regular-events/${eventId}/vote-options`)
        if (response.ok) {
          const data = await response.json()
          setVoteOptions(data.voteOptions || [])
        } else {
          throw new Error('투표 후보를 불러올 수 없습니다.')
        }
      } catch (err) {
        console.error('Failed to fetch vote options:', err)
        setError('투표 후보를 불러오는 데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (isAuthor) {
      fetchVoteOptions()
    }
  }, [eventId, isAuthor])

  const addVoteOption = async () => {
    if (!newOptionValue.trim()) return

    try {
      setAddingOption(true)
      const response = await fetch(`/api/regular-events/${eventId}/vote-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionType: newOptionType,
          optionValue: newOptionValue.trim(),
          weekNumber: currentWeek,
          year: currentYear
        })
      })

      if (response.ok) {
        setNewOptionValue('')
        await fetchVoteOptions() // 목록 새로고침
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표 후보 추가에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to add vote option:', err)
      setError(err instanceof Error ? err.message : '투표 후보 추가에 실패했습니다.')
    } finally {
      setAddingOption(false)
    }
  }

  const deleteVoteOption = async (voteOptionId: string) => {
    if (!confirm('이 투표 후보를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/regular-events/${eventId}/vote-options?voteOptionId=${voteOptionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVoteOptions() // 목록 새로고침
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표 후보 삭제에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to delete vote option:', err)
      setError(err instanceof Error ? err.message : '투표 후보 삭제에 실패했습니다.')
    }
  }

  const getCurrentWeek = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil((days + start.getDay() + 1) / 7)
  }

  if (!isAuthor) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🎛️ 투표 후보 관리</h3>
        <p className="text-gray-400">투표 후보를 불러오는 중...</p>
      </div>
    )
  }

  const trackOptions = voteOptions.filter(option => option.option_type === 'track')
  const carClassOptions = voteOptions.filter(option => option.option_type === 'car_class')

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-bold text-white mb-4">🎛️ 투표 후보 관리</h3>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* 투표 후보 추가 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">➕ 새 투표 후보 추가</h4>
        <div className="flex gap-3 mb-3">
          <select
            value={newOptionType}
            onChange={(e) => setNewOptionType(e.target.value as 'track' | 'car_class')}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
          >
            <option value="track">트랙</option>
            <option value="car_class">차량 클래스</option>
          </select>
          <input
            type="text"
            value={newOptionValue}
            onChange={(e) => setNewOptionValue(e.target.value)}
            placeholder="새 후보 이름 입력"
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
          />
          <button
            onClick={addVoteOption}
            disabled={addingOption || !newOptionValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingOption ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>

      {/* 트랙 후보 목록 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">📍 트랙 후보</h4>
        {trackOptions.length > 0 ? (
          <div className="space-y-2">
            {trackOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <span className="text-white">{option.option_value}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{option.votes_count}표</span>
                  <button
                    onClick={() => deleteVoteOption(option.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">등록된 트랙 후보가 없습니다.</p>
        )}
      </div>

      {/* 차량 클래스 후보 목록 */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-300 mb-3">🚗 차량 클래스 후보</h4>
        {carClassOptions.length > 0 ? (
          <div className="space-y-2">
            {carClassOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                <span className="text-white">{option.option_value}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{option.votes_count}표</span>
                  <button
                    onClick={() => deleteVoteOption(option.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">등록된 차량 클래스 후보가 없습니다.</p>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {currentYear}년 {currentWeek}주차 기준
      </div>
    </div>
  )
}
