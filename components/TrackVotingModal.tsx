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

  const fetchTrackOptions = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`)
      if (response.ok) {
        const data = await response.json()
        setTrackOptions(data.options || [])
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
              투표 옵션이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {trackOptions.map((option) => (
                <div key={option.id} className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-3">{option.track_name}</h3>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-gray-600 px-3 py-1 rounded-lg">
                          <span className="text-gray-300 text-sm">투표수:</span>
                          <span className="text-white font-bold text-lg">{option.votes}표</span>
                        </div>
                        {option.user_voted && (
                          <span className="text-green-400 text-sm font-medium bg-green-900/30 px-3 py-1 rounded-lg">✓ 투표완료</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {!option.user_voted ? (
                        <button
                          onClick={() => handleVote(option.id)}
                          disabled={voting}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                        >
                          <span className="text-lg">🗳️</span>
                          {voting ? '투표 중...' : '투표하기'}
                        </button>
                      ) : (
                        <span className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          투표완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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