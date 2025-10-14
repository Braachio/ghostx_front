'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

interface VoteOption {
  option_type: string
  option_value: string
  votes_count: number
}

interface VotingPanelProps {
  regularEventId: string
  weekNumber?: number
  year?: number
}

interface VoteData {
  voteOptions: {
    tracks: VoteOption[]
    carClasses: VoteOption[]
  }
  userVote: {
    track_option: string
    car_class_option: string
  } | null
  participantCount: number
  votingClosed: boolean
  weekInfo: {
    week: number
    year: number
  }
}

export default function VotingPanel({ regularEventId, weekNumber, year }: VotingPanelProps) {
  const [user, setUser] = useState<User | null>(null)
  const [voteData, setVoteData] = useState<VoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedCarClass, setSelectedCarClass] = useState('')
  const [error, setError] = useState('')
  const [isEventOwner, setIsEventOwner] = useState(false)
  const [togglingVoteStatus, setTogglingVoteStatus] = useState(false)

  useEffect(() => {
    // 사용자 인증 상태 확인
    const checkUser = async () => {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchVoteData()
    } else {
      setLoading(false)
    }
  }, [user, fetchVoteData])

  const fetchVoteData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (weekNumber) params.append('week_number', weekNumber.toString())
      if (year) params.append('year', year.toString())

      const response = await fetch(`/api/regular-events/${regularEventId}/vote?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVoteData(data)
        
        // 사용자의 기존 투표가 있으면 선택
        if (data.userVote) {
          setSelectedTrack(data.userVote.track_option)
          setSelectedCarClass(data.userVote.car_class_option)
        }
        
        // 이벤트 소유자인지 확인
        await checkEventOwnership()
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch (error) {
      console.error('투표 데이터 로드 실패:', error)
      setError('투표 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [regularEventId, weekNumber, year, user])

  const checkEventOwnership = async () => {
    try {
      const response = await fetch('/api/multis')
      if (response.ok) {
        const events = await response.json()
        const event = events.find((e: { id: string; author_id: string }) => e.id === regularEventId)
        setIsEventOwner(event && user && event.author_id === user.id)
      }
    } catch (error) {
      console.error('이벤트 소유자 확인 실패:', error)
    }
  }

  const toggleVotingStatus = async () => {
    if (!voteData) return
    
    try {
      setTogglingVoteStatus(true)
      setError('')

      const response = await fetch(`/api/regular-events/${regularEventId}/vote/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week_number: voteData.weekInfo.week,
          year: voteData.weekInfo.year,
          voting_closed: !voteData.votingClosed
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        // 데이터 새로고침
        await fetchVoteData()
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch (error) {
      console.error('투표 상태 변경 실패:', error)
      setError('투표 상태 변경 중 오류가 발생했습니다.')
    } finally {
      setTogglingVoteStatus(false)
    }
  }

  const handleVote = async () => {
    if (!selectedTrack || !selectedCarClass) {
      setError('트랙과 차량 클래스를 모두 선택해주세요.')
      return
    }

    try {
      setVoting(true)
      setError('')

      const response = await fetch(`/api/regular-events/${regularEventId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          track_option: selectedTrack,
          car_class_option: selectedCarClass,
          week_number: voteData?.weekInfo.week,
          year: voteData?.weekInfo.year
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        // 투표 후 데이터 새로고침
        await fetchVoteData()
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch (error) {
      console.error('투표 실패:', error)
      setError('투표 중 오류가 발생했습니다.')
    } finally {
      setVoting(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🗳️ 투표</h3>
        <p className="text-gray-400">Steam 로그인이 필요합니다.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🗳️ 투표</h3>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">투표 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🗳️ 투표</h3>
        <div className="text-red-400 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchVoteData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!voteData) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">🗳️ 투표</h3>
        <p className="text-gray-400">투표 데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const { voteOptions, userVote, participantCount, votingClosed, weekInfo } = voteData

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-white">🗳️ 투표</h3>
          {votingClosed && (
            <span className="px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-300">
              🔒 투표 종료됨
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {weekInfo.year}년 {weekInfo.week}주차 | 참가자 {participantCount}명
          </div>
          {isEventOwner && (
            <button
              onClick={toggleVotingStatus}
              disabled={togglingVoteStatus}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                votingClosed
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {togglingVoteStatus 
                ? '처리중...' 
                : votingClosed 
                  ? '투표 재개' 
                  : '투표 종료'
              }
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* 트랙 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            🏁 트랙 선택
          </label>
          <div className="grid grid-cols-2 gap-2">
            {voteOptions.tracks.map((track) => (
              <label key={track.option_value} className={`flex items-center space-x-2 ${votingClosed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name="track"
                  value={track.option_value}
                  checked={selectedTrack === track.option_value}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  disabled={votingClosed}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-white text-sm">{track.option_value}</span>
                <span className="text-gray-400 text-xs">({track.votes_count}표)</span>
              </label>
            ))}
          </div>
        </div>

        {/* 차량 클래스 선택 */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            🚗 차량 클래스 선택
          </label>
          <div className="grid grid-cols-2 gap-2">
            {voteOptions.carClasses.map((carClass) => (
              <label key={carClass.option_value} className={`flex items-center space-x-2 ${votingClosed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name="carClass"
                  value={carClass.option_value}
                  checked={selectedCarClass === carClass.option_value}
                  onChange={(e) => setSelectedCarClass(e.target.value)}
                  disabled={votingClosed}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <span className="text-white text-sm">{carClass.option_value}</span>
                <span className="text-gray-400 text-xs">({carClass.votes_count}표)</span>
              </label>
            ))}
          </div>
        </div>

        {/* 투표 버튼 */}
        <div className="pt-4 border-t border-gray-700">
          {votingClosed ? (
            <div className="text-center py-4">
              <div className="text-red-400 font-semibold mb-2">🔒 투표가 종료되었습니다</div>
              <p className="text-gray-400 text-sm">이벤트 작성자가 투표를 재개할 때까지 기다려주세요.</p>
            </div>
          ) : (
            <button
              onClick={handleVote}
              disabled={voting || !selectedTrack || !selectedCarClass}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {voting ? '투표 중...' : userVote ? '투표 변경하기' : '투표하기'}
            </button>
          )}
        </div>

        {/* 현재 투표 상태 */}
        {userVote && (
          <div className="text-sm text-gray-400 text-center">
            현재 투표: {userVote.track_option} + {userVote.car_class_option}
          </div>
        )}
      </div>
    </div>
  )
}
