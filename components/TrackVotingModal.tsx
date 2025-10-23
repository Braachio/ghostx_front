'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface TrackVotingModalProps {
  isOpen: boolean
  onClose: () => void
  regularEventId: string
  isOwner?: boolean
  game?: string
}

interface TrackOption {
  id: string
  option_value: string
  votes_count: number
}

interface VoteData {
  trackOptions: TrackOption[]
  userVote: { id: string; track_option_id: string } | null
  participantCount: number
  votingOpen: boolean
  schedule: { voting_start: string; voting_end: string } | null
}

export default function TrackVotingModal({ 
  isOpen, 
  onClose, 
  regularEventId, 
  isOwner = false,
  game = 'competizione'
}: TrackVotingModalProps) {
  const [voteData, setVoteData] = useState<VoteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)

  useEffect(() => {
    if (isOpen && regularEventId) {
      checkUser()
      fetchVoteData()
    }
  }, [isOpen, regularEventId])

  const checkUser = async () => {
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchVoteData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-data`)
      if (response.ok) {
        const data = await response.json()
        setVoteData(data)
        setIsParticipant(data.isParticipant || false)
      } else {
        setError('투표 데이터를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('투표 데이터 가져오기 실패:', error)
      setError('투표 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (optionId: string) => {
    if (!user || !isParticipant) return

    try {
      setVoting(true)
      const response = await fetch(`/api/regular-events/${regularEventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_option_id: optionId }),
      })

      if (response.ok) {
        await fetchVoteData()
        alert('투표가 완료되었습니다!')
      } else {
        const errorData = await response.json()
        alert(`투표 실패: ${errorData.error}`)
      }
    } catch (error) {
      console.error('투표 실패:', error)
      alert('투표 중 오류가 발생했습니다.')
    } finally {
      setVoting(false)
    }
  }

  const getTimeLeft = () => {
    if (!voteData?.schedule) return ''
    
    const now = new Date()
    const endTime = new Date(voteData.schedule.voting_end)
    const timeLeft = endTime.getTime() - now.getTime()
    
    if (timeLeft <= 0) return '투표 종료'
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}시간 ${minutes}분 남음`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-600 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-800 border-b border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🏁</span>
              트랙 투표
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
          {voteData?.votingOpen && (
            <div className="mt-2 text-blue-400">
              {getTimeLeft()}
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">투표 데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchVoteData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">투표하려면 로그인이 필요합니다.</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                로그인하기
              </button>
            </div>
          ) : !isParticipant ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">참가 신청 후 투표할 수 있습니다.</p>
              <p className="text-gray-500 text-sm">
                먼저 이벤트에 참가 신청을 해주세요.
              </p>
            </div>
          ) : !voteData?.votingOpen ? (
            <div className="text-center py-8">
              <div className="p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                <p className="text-yellow-400">
                  투표 기간이 아닙니다.
                </p>
              </div>
            </div>
          ) : voteData.trackOptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">투표 옵션이 없습니다.</p>
              <p className="text-gray-500 text-sm">
                이벤트 설정에서 투표 옵션을 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {voteData.trackOptions.map((option) => {
                const isSelected = voteData.userVote?.track_option_id === option.id
                const percentage = voteData.participantCount > 0 
                  ? Math.round((option.votes_count / voteData.participantCount) * 100) 
                  : 0

                return (
                  <div key={option.id} className={`p-4 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-blue-900/20 border-blue-500/50' 
                      : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-4 cursor-pointer flex-1">
                        <input
                          type="radio"
                          name="track-vote"
                          checked={isSelected}
                          onChange={() => handleVote(option.id)}
                          disabled={!voteData.votingOpen || voting}
                          className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                        />
                        <span className="text-white font-semibold text-lg">{option.option_value}</span>
                      </label>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">
                          {option.votes_count}표
                        </div>
                        <div className="text-sm text-gray-400">
                          {percentage}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {voteData.userVote && (
                <div className="mt-6 p-4 bg-green-900/30 border border-green-600 rounded-lg">
                  <p className="text-green-400 text-center">
                    ✅ 투표 완료: {voteData.trackOptions.find(opt => opt.id === voteData.userVote?.track_option_id)?.option_value}
                  </p>
                </div>
              )}

              {voting && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">투표 처리 중...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="bg-gray-800 border-t border-gray-600 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              참가자: {voteData?.participantCount || 0}명
            </div>
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
