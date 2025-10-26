'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Plus, Trash2, Play, Pause, Vote, Users } from 'lucide-react'

interface VoteOption {
  id: string
  option_value: string
  votes_count: number
  voting_closed: boolean
}

interface VoteManagementModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  userId: string
}

export default function VoteManagementModal({ 
  isOpen, 
  onClose, 
  eventId, 
  eventTitle, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId 
}: VoteManagementModalProps) {
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [addingOption, setAddingOption] = useState(false)
  const [newOptionValue, setNewOptionValue] = useState('')
  const [isVotingClosed, setIsVotingClosed] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [userVote, setUserVote] = useState<{ id: string; track_option_id: string } | null>(null)

  // 투표 상태 조회
  const fetchVoteStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/regular-events/${eventId}/vote`)
      
      if (!response.ok) {
        throw new Error('투표 상태 조회에 실패했습니다.')
      }
      
      const data = await response.json()
      setVoteOptions(data.trackOptions || [])
      setIsVotingClosed(data.votingClosed || false)
      setParticipantCount(data.participantCount || 0)
      setUserVote(data.userVote)
      
      console.log('투표 상태 조회 성공:', data)
    } catch (error) {
      console.error('투표 상태 조회 실패:', error)
      alert('투표 상태를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // 새 투표 옵션 추가
  const handleAddOption = async () => {
    if (!newOptionValue.trim()) return
    
    try {
      setAddingOption(true)
      const response = await fetch(`/api/regular-events/${eventId}/vote-options`, {
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

      const result = await response.json()
      console.log('투표 옵션 추가 성공:', result)
      
      setNewOptionValue('')
      await fetchVoteStatus()
      alert('투표 옵션이 추가되었습니다.')
    } catch (error) {
      console.error('옵션 추가 실패:', error)
      alert(error instanceof Error ? error.message : '옵션 추가 중 오류가 발생했습니다.')
    } finally {
      setAddingOption(false)
    }
  }

  // 투표 옵션 삭제
  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('이 투표 옵션을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/regular-events/${eventId}/vote-options/${optionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '옵션 삭제에 실패했습니다.')
      }

      const result = await response.json()
      console.log('투표 옵션 삭제 성공:', result)
      
      await fetchVoteStatus()
      alert('투표 옵션이 삭제되었습니다.')
    } catch (error) {
      console.error('옵션 삭제 실패:', error)
      alert(error instanceof Error ? error.message : '옵션 삭제 중 오류가 발생했습니다.')
    }
  }

  // 투표 시작
  const handleStartVoting = async () => {
    try {
      const response = await fetch(`/api/regular-events/${eventId}/vote/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voting_closed: false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표 시작에 실패했습니다.')
      }

      const data = await response.json()
      console.log('투표 시작 응답:', data)
      
      await fetchVoteStatus()
      
      if (data.warning) {
        alert(`투표가 시작되었습니다.\n\n경고: ${data.warning}`)
      } else {
        alert('투표가 시작되었습니다.')
      }
    } catch (error) {
      console.error('투표 시작 실패:', error)
      alert(error instanceof Error ? error.message : '투표 시작 중 오류가 발생했습니다.')
    }
  }

  // 투표 종료
  const handleStopVoting = async () => {
    if (!confirm('투표를 종료하시겠습니까? 종료 후에는 다시 시작할 수 없습니다.')) return
    
    try {
      const response = await fetch(`/api/regular-events/${eventId}/vote/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voting_closed: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표 종료에 실패했습니다.')
      }

      const data = await response.json()
      console.log('투표 종료 응답:', data)
      
      await fetchVoteStatus()
      
      if (data.warning) {
        alert(`투표가 종료되었습니다.\n\n경고: ${data.warning}`)
      } else {
        alert('투표가 종료되었습니다.')
      }
    } catch (error) {
      console.error('투표 종료 실패:', error)
      alert(error instanceof Error ? error.message : '투표 종료 중 오류가 발생했습니다.')
    }
  }

  // 투표하기
  const handleVote = async (optionId: string) => {
    try {
      const response = await fetch(`/api/regular-events/${eventId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_option_id: optionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표에 실패했습니다.')
      }

      const data = await response.json()
      console.log('투표 응답:', data)
      
      await fetchVoteStatus()
      alert('투표가 완료되었습니다.')
    } catch (error) {
      console.error('투표 실패:', error)
      alert(error instanceof Error ? error.message : '투표 중 오류가 발생했습니다.')
    }
  }

  // 갤멀 삭제
  const handleDeleteEvent = async () => {
    if (!confirm(`"${eventTitle}" 갤멀을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 투표 데이터와 참가자 정보가 함께 삭제됩니다.`)) return

    try {
      const response = await fetch(`/api/multis/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '갤멀 삭제에 실패했습니다.')
      }

      alert('갤멀이 성공적으로 삭제되었습니다.')
      onClose() // 모달 닫기
      // 페이지 새로고침하여 변경사항 반영
      window.location.reload()
    } catch (error) {
      console.error('갤멀 삭제 오류:', error)
      alert(error instanceof Error ? error.message : '갤멀 삭제 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    if (isOpen && eventId) {
      fetchVoteStatus()
    }
  }, [isOpen, eventId, fetchVoteStatus])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Vote className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                투표 관리
              </h2>
              <p className="text-sm text-gray-600">{eventTitle}</p>
            </div>
            {isVotingClosed && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                투표 종료
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">투표 상태를 불러오는 중...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 투표 상태 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">참가자: {participantCount}명</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Vote className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">옵션: {voteOptions.length}개</span>
                    </div>
                  </div>
                  
                  {/* 투표 시작/종료 버튼 */}
                  <div className="flex space-x-2">
                    {isVotingClosed ? (
                      <button
                        onClick={handleStartVoting}
                        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>투표 시작</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleStopVoting}
                        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <Pause className="w-4 h-4" />
                        <span>투표 종료</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 새 옵션 추가 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">새 투표 옵션 추가</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    placeholder="트랙 이름을 입력하세요"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <button
                    onClick={handleAddOption}
                    disabled={addingOption || !newOptionValue.trim()}
                    className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingOption ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{addingOption ? '추가 중...' : '추가'}</span>
                  </button>
                </div>
              </div>

              {/* 투표 옵션 목록 */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">투표 옵션</h3>
                {voteOptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    투표 옵션이 없습니다. 위에서 새 옵션을 추가해주세요.
                  </div>
                ) : (
                  voteOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {option.option_value}
                          </h4>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {option.votes_count}표
                          </span>
                          {userVote?.track_option_id === option.id && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              내 투표
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* 투표 버튼 */}
                        {!isVotingClosed && (
                          <button
                            onClick={() => handleVote(option.id)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              userVote?.track_option_id === option.id
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {userVote?.track_option_id === option.id ? '투표됨' : '투표하기'}
                          </button>
                        )}
                        
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => handleDeleteOption(option.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>삭제</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            총 {voteOptions.length}개의 투표 옵션
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>갤멀 삭제</span>
            </button>
            <button
              onClick={fetchVoteStatus}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              새로고침
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
