'use client'

import { useState, useEffect, useCallback } from 'react'

interface TrackOption {
  id: string
  track_name: string
  votes: number
  user_voted: boolean
}

interface TrackVotingModalProps {
  isOpen: boolean
  onClose: () => void
  regularEventId: string
  isOwner: boolean
  game: string
}

export default function TrackVotingModal({ isOpen, onClose, regularEventId, isOwner, game }: TrackVotingModalProps) {
  const [trackOptions, setTrackOptions] = useState<TrackOption[]>([])
  const [loading, setLoading] = useState(false)
  const [voting, setVoting] = useState(false)
  const [newOptionValue, setNewOptionValue] = useState('')
  const [addingOption, setAddingOption] = useState(false)

  const fetchTrackOptions = useCallback(async () => {
    setLoading(true)
    try {
      console.log('트랙 옵션 가져오기 시작:', { regularEventId })
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`)
      console.log('트랙 옵션 API 응답:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        const data = await response.json()
        console.log('트랙 옵션 데이터:', data)
        setTrackOptions(data.options || [])
      } else {
        const errorData = await response.json()
        console.error('트랙 옵션 API 오류:', errorData)
      }
    } catch (error) {
      console.error('트랙 옵션 가져오기 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [regularEventId])

  useEffect(() => {
    if (isOpen && regularEventId) {
      fetchTrackOptions()
    }
  }, [isOpen, regularEventId, fetchTrackOptions])

  const handleVote = async (optionId: string) => {
    setVoting(true)
    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      })

      if (response.ok) {
        // 투표 후 옵션 목록 새로고침
        fetchTrackOptions()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '투표에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 오류:', error)
      alert('투표 중 오류가 발생했습니다.')
    } finally {
      setVoting(false)
    }
  }

  const handleCloseVoting = async () => {
    if (!isOwner) return
    
    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/close-voting`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('투표가 종료되었습니다.')
        onClose()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '투표 종료에 실패했습니다.')
      }
    } catch (error) {
      console.error('투표 종료 오류:', error)
      alert('투표 종료 중 오류가 발생했습니다.')
    }
  }

  const handleAddOption = async () => {
    if (!newOptionValue.trim() || !isOwner) return

    setAddingOption(true)
    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option_type: 'track',
          option_value: newOptionValue.trim()
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '옵션 추가에 실패했습니다.')
      }

      setNewOptionValue('')
      await fetchTrackOptions()
    } catch (error) {
      console.error('옵션 추가 실패:', error)
      alert(error instanceof Error ? error.message : '옵션 추가 중 오류가 발생했습니다.')
    } finally {
      setAddingOption(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">트랙 투표</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">로딩 중...</span>
            </div>
          ) : trackOptions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="mb-4">
                투표 옵션이 없습니다.
              </div>
              {isOwner && (
                <div className="max-w-md mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      placeholder="트랙 이름을 입력하세요"
                      className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddOption}
                      disabled={addingOption || !newOptionValue.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addingOption ? '추가 중...' : '추가'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    첫 번째 트랙 옵션을 추가해주세요.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {trackOptions.map((option) => (
                <div key={option.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-lg">{option.track_name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">투표수:</span>
                          <span className="text-white font-semibold">{option.votes}표</span>
                        </div>
                        {option.user_voted && (
                          <span className="text-green-400 text-sm font-medium">✓ 투표완료</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {!option.user_voted ? (
                        <button
                          onClick={() => handleVote(option.id)}
                          disabled={voting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {voting ? '투표 중...' : '투표하기'}
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-green-600 text-white rounded-lg">
                          투표완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 이벤트 소유자용 추가 옵션 입력 */}
          {isOwner && trackOptions.length > 0 && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="text-white font-medium mb-3">새 트랙 옵션 추가</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  placeholder="트랙 이름을 입력하세요"
                  className="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddOption}
                  disabled={addingOption || !newOptionValue.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingOption ? '추가 중...' : '추가'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-gray-400 text-sm">
            {game} 트랙 투표
          </div>
          <div className="flex gap-3">
            {isOwner && (
              <button
                onClick={handleCloseVoting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                투표 종료
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}