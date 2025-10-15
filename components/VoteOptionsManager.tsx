'use client'

import { useState, useEffect } from 'react'

interface VoteOption {
  id: string
  option_type: 'track' | 'car_class'
  option_value: string
  votes_count: number
  week_number: number
  year: number
}

interface VoteOptionsManagerProps {
  regularEventId: string
  weekNumber?: number
  year?: number
  isOwner: boolean
}

export default function VoteOptionsManager({ 
  regularEventId, 
  weekNumber, 
  year, 
  isOwner 
}: VoteOptionsManagerProps) {
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingOption, setEditingOption] = useState<string | null>(null)
  const [newOptionValue, setNewOptionValue] = useState('')
  const [newOptionType, setNewOptionType] = useState<'track' | 'car_class'>('track')
  const [showAddForm, setShowAddForm] = useState(false)

  const currentWeek = weekNumber || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)
  const currentYear = year || new Date().getFullYear()

  useEffect(() => {
    if (isOwner) {
      fetchVoteOptions()
    }
  }, [regularEventId, currentWeek, currentYear, isOwner])

  const fetchVoteOptions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`)
      
      if (response.ok) {
        const data = await response.json()
        // 현재 주차/년도의 옵션만 필터링
        const filteredOptions = data.voteOptions.filter((option: VoteOption) => 
          option.week_number === currentWeek && option.year === currentYear
        )
        setVoteOptions(filteredOptions)
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch (error) {
      console.error('투표 옵션 로드 실패:', error)
      setError('투표 옵션을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditStart = (optionId: string, currentValue: string) => {
    setEditingOption(optionId)
    setNewOptionValue(currentValue)
  }

  const handleEditSave = async (optionId: string) => {
    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId,
          optionValue: newOptionValue
        })
      })

      if (response.ok) {
        await fetchVoteOptions()
        setEditingOption(null)
        setNewOptionValue('')
      } else {
        const errorData = await response.json()
        alert(errorData.error || '수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 옵션 수정 실패:', error)
      alert('투표 옵션 수정 중 오류가 발생했습니다.')
    }
  }

  const handleEditCancel = () => {
    setEditingOption(null)
    setNewOptionValue('')
  }

  const handleDelete = async (optionId: string) => {
    if (!confirm('이 투표 옵션을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options?voteOptionId=${optionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVoteOptions()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 옵션 삭제 실패:', error)
      alert('투표 옵션 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleAddOption = async () => {
    if (!newOptionValue.trim()) {
      alert('옵션 값을 입력해주세요.')
      return
    }

    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`, {
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
        await fetchVoteOptions()
        setNewOptionValue('')
        setShowAddForm(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || '추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 옵션 추가 실패:', error)
      alert('투표 옵션 추가 중 오류가 발생했습니다.')
    }
  }

  if (!isOwner) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">투표 옵션 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="text-red-400 text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchVoteOptions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  const trackOptions = voteOptions.filter(option => option.option_type === 'track')
  const carClassOptions = voteOptions.filter(option => option.option_type === 'car_class')

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">투표 옵션 관리</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          {showAddForm ? '취소' : '옵션 추가'}
        </button>
      </div>

      {/* 옵션 추가 폼 */}
      {showAddForm && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">타입</label>
              <select
                value={newOptionType}
                onChange={(e) => setNewOptionType(e.target.value as 'track' | 'car_class')}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
              >
                <option value="track">트랙</option>
                <option value="car_class">차량 클래스</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">옵션 값</label>
              <input
                type="text"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white"
                placeholder="예: 모나코, F1"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddOption}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 트랙 옵션 */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-white mb-3">🏁 트랙 옵션</h4>
        <div className="space-y-2">
          {trackOptions.length === 0 ? (
            <p className="text-gray-400 text-sm">트랙 옵션이 없습니다.</p>
          ) : (
            trackOptions.map((option) => (
              <div key={option.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                {editingOption === option.id ? (
                  <>
                    <input
                      type="text"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      className="flex-1 px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => handleEditSave(option.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-white">{option.option_value}</span>
                    <span className="text-gray-400 text-sm">({option.votes_count}표)</span>
                    <button
                      onClick={() => handleEditStart(option.id, option.option_value)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(option.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 차량 클래스 옵션 */}
      <div>
        <h4 className="text-md font-semibold text-white mb-3">🚗 차량 클래스 옵션</h4>
        <div className="space-y-2">
          {carClassOptions.length === 0 ? (
            <p className="text-gray-400 text-sm">차량 클래스 옵션이 없습니다.</p>
          ) : (
            carClassOptions.map((option) => (
              <div key={option.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                {editingOption === option.id ? (
                  <>
                    <input
                      type="text"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      className="flex-1 px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => handleEditSave(option.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-white">{option.option_value}</span>
                    <span className="text-gray-400 text-sm">({option.votes_count}표)</span>
                    <button
                      onClick={() => handleEditStart(option.id, option.option_value)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(option.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}