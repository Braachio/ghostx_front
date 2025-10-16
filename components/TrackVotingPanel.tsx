'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface TrackVotingPanelProps {
  regularEventId: string
  isOwner?: boolean
  onVoteChange?: () => void
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

export default function TrackVotingPanel({ 
  regularEventId, 
  isOwner = false,
  onVoteChange,
  game = 'competizione'
}: TrackVotingPanelProps) {
  const [voteData, setVoteData] = useState<VoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [showOptionManager, setShowOptionManager] = useState(false)
  const [newOptionValue, setNewOptionValue] = useState('')

  const supabase = createClientComponentClient()

  // 게임별 트랙 리스트
  const gameTracks: Record<string, string[]> = {
    'iracing': [
      'Watkins Glen International',
      'Silverstone Circuit',
      'Spa-Francorchamps',
      'Monza',
      'Nürburgring',
      'Daytona International Speedway',
      'Indianapolis Motor Speedway',
      'Sebring International Raceway',
      'Road America',
      'Laguna Seca'
    ],
    'assettocorsa': [
      'Nürburgring Nordschleife',
      'Spa-Francorchamps',
      'Silverstone',
      'Monza',
      'Imola',
      'Mugello',
      'Brands Hatch',
      'Donington Park',
      'Suzuka',
      'Fuji Speedway'
    ],
    'gran-turismo7': [
      'Spa-Francorchamps',
      'Nürburgring',
      'Monza',
      'Silverstone',
      'Suzuka',
      'Fuji Speedway',
      'Laguna Seca',
      'Watkins Glen',
      'Daytona',
      'Le Mans'
    ],
    'automobilista2': [
      'Interlagos',
      'Silverstone',
      'Spa-Francorchamps',
      'Monza',
      'Nürburgring',
      'Imola',
      'Mugello',
      'Brands Hatch',
      'Donington Park',
      'Watkins Glen'
    ],
    'competizione': [
      'Barcelona',
      'Silverstone',
      'Spa-Francorchamps',
      'Monza',
      'Nürburgring',
      'Imola',
      'Mugello',
      'Brands Hatch',
      'Donington Park',
      'Zandvoort'
    ],
    'lemans': [
      'Le Mans',
      'Spa-Francorchamps',
      'Silverstone',
      'Monza',
      'Nürburgring',
      'Imola',
      'Mugello',
      'Brands Hatch',
      'Donington Park',
      'Watkins Glen'
    ],
    'f1-25': [
      'Silverstone',
      'Monza',
      'Spa-Francorchamps',
      'Monaco',
      'Suzuka',
      'Interlagos',
      'Red Bull Ring',
      'Hungaroring',
      'Circuit of the Americas',
      'Abu Dhabi'
    ],
    'ea-wrc': [
      'Monte Carlo',
      'Sweden',
      'Mexico',
      'Croatia',
      'Portugal',
      'Sardinia',
      'Kenya',
      'Estonia',
      'Finland',
      'Greece'
    ]
  }

  // 사용자 정보 및 참가 상태 확인
  useEffect(() => {
    const checkUserAndParticipation = async () => {
      try {
        const supabaseClient = createClientComponentClient()
        
        // 사용자 정보 가져오기
        const { data: { user } } = await supabaseClient.auth.getUser()
        setUser(user)

        if (!user) return

        // 참가 상태 확인
        const { data: participant } = await supabaseClient
          .from('participants')
          .select('id')
          .eq('event_id', regularEventId)
          .eq('user_id', user.id)
          .single()

        setIsParticipant(!!participant)
      } catch (error) {
        console.error('사용자/참가 상태 확인 오류:', error)
      }
    }

    checkUserAndParticipation()
  }, [regularEventId])

  // 투표 데이터 가져오기
  const fetchVoteData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/regular-events/${regularEventId}/vote`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표 데이터를 불러올 수 없습니다.')
      }

      const data = await response.json()
      setVoteData(data)
    } catch (error) {
      console.error('투표 데이터 가져오기 실패:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [regularEventId])

  useEffect(() => {
    fetchVoteData()
  }, [fetchVoteData])

  // 투표 옵션 추가
  const handleAddOption = async () => {
    if (!newOptionValue.trim() || !isOwner) return

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
      await fetchVoteData()
    } catch (error) {
      console.error('옵션 추가 실패:', error)
      setError(error instanceof Error ? error.message : '옵션 추가 중 오류가 발생했습니다.')
    }
  }


  // 투표 옵션 삭제
  const handleDeleteOption = async (optionId: string) => {
    if (!isOwner) return

    if (!confirm('이 투표 옵션을 삭제하시겠습니까? 삭제된 옵션에 대한 기존 투표도 함께 삭제됩니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/regular-events/${regularEventId}/vote-options`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option_id: optionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '옵션 삭제에 실패했습니다.')
      }

      await fetchVoteData()
    } catch (error) {
      console.error('옵션 삭제 실패:', error)
      setError(error instanceof Error ? error.message : '옵션 삭제 중 오류가 발생했습니다.')
    }
  }

  // 투표하기
  const handleVote = async (trackOptionId: string) => {
    if (!user || !isParticipant || voting) return

    try {
      setVoting(true)
      setError(null)

      const response = await fetch(`/api/regular-events/${regularEventId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_option_id: trackOptionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표에 실패했습니다.')
      }

      // 투표 데이터 새로고침
      await fetchVoteData()
      
      if (onVoteChange) {
        onVoteChange()
      }

    } catch (error) {
      console.error('투표 실패:', error)
      setError(error instanceof Error ? error.message : '투표 중 오류가 발생했습니다.')
    } finally {
      setVoting(false)
    }
  }

  // 투표 종료까지 남은 시간 계산
  const getTimeLeft = () => {
    if (!voteData?.schedule) return null
    
    const now = new Date()
    const endTime = new Date(voteData.schedule.voting_end)
    const diff = endTime.getTime() - now.getTime()
    
    if (diff <= 0) return '투표 종료'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}일 ${hours}시간 남음`
    } else {
      return `${hours}시간 남음`
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">투표 데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-4">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchVoteData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!voteData || voteData.trackOptions.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-4">
          <p className="text-gray-400">투표 옵션이 없습니다.</p>
          {isOwner && (
            <p className="text-gray-500 text-sm mt-2">
              이벤트 설정에서 투표 옵션을 추가해주세요.
            </p>
          )}
        </div>
      </div>
    )
  }

  // 참가자만 투표 가능
  if (!user) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-4">
          <p className="text-gray-400 mb-4">투표하려면 로그인이 필요합니다.</p>
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </a>
        </div>
      </div>
    )
  }

  if (!isParticipant) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="text-center py-4">
          <p className="text-gray-400 mb-4">참가 신청 후 투표할 수 있습니다.</p>
          <p className="text-gray-500 text-sm">
            먼저 이벤트에 참가 신청을 해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">🏁 트랙 투표</h3>
        <div className="flex items-center gap-3">
          {voteData.votingOpen && (
            <div className="text-sm text-blue-400">
              {getTimeLeft()}
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => setShowOptionManager(!showOptionManager)}
              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              {showOptionManager ? '관리 닫기' : '옵션 관리'}
            </button>
          )}
        </div>
      </div>

      {!voteData.votingOpen && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
          <p className="text-yellow-400 text-sm">
            투표 기간이 아닙니다.
          </p>
        </div>
      )}

      {/* 옵션 관리 섹션 */}
      {isOwner && showOptionManager && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
          <h4 className="text-sm font-semibold text-white mb-3">투표 옵션 관리</h4>
          
          {/* 새 옵션 추가 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-300 mb-2">새 트랙 옵션 추가</label>
            <div className="flex gap-2">
              <select
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">트랙을 선택하세요</option>
                {gameTracks[game]?.map((track) => (
                  <option key={track} value={track}>
                    {track}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddOption}
                disabled={!newOptionValue.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                추가
              </button>
            </div>
          </div>

          {/* 기존 옵션 목록 */}
          <div>
            <label className="block text-xs text-gray-300 mb-2">기존 옵션 관리</label>
            <div className="space-y-2">
              {voteData.trackOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded">
                  <span className="flex-1 text-white text-sm">{option.option_value}</span>
                  <span className="text-xs text-gray-400">{option.votes_count}표</span>
                  <button
                    onClick={() => handleDeleteOption(option.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {voteData.trackOptions.map((option) => {
          const isSelected = voteData.userVote?.track_option_id === option.id
          const percentage = voteData.participantCount > 0 
            ? Math.round((option.votes_count / voteData.participantCount) * 100) 
            : 0

          return (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="track-vote"
                    checked={isSelected}
                    onChange={() => handleVote(option.id)}
                    disabled={!voteData.votingOpen || voting}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                  />
                  <span className="text-white font-medium">{option.option_value}</span>
                </label>
                <div className="text-sm text-gray-400">
                  {option.votes_count}표 ({percentage}%)
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {voteData.userVote && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-600 rounded-lg">
          <p className="text-green-400 text-sm">
            ✅ 투표 완료: {voteData.trackOptions.find(opt => opt.id === voteData.userVote?.track_option_id)?.option_value}
          </p>
        </div>
      )}

      {voting && (
        <div className="mt-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-2">투표 처리 중...</p>
        </div>
      )}
    </div>
  )
}
