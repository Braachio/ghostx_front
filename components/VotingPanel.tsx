'use client'

import { useEffect, useState } from 'react'
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
  voteType?: 'track' | 'class' | 'all' // 투표 타입 추가
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

export default function VotingPanel({ regularEventId, weekNumber, year, voteType = 'all' }: VotingPanelProps) {
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

  const fetchVoteData = async () => {
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
  }

  useEffect(() => {
    if (user) {
      fetchVoteData()
    } else {
      setLoading(false)
    }
  }, [user, regularEventId, weekNumber, year]) // eslint-disable-line react-hooks/exhaustive-deps

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
    // voteType에 따라 필요한 선택 확인
    if (voteType === 'track' && !selectedTrack) {
      setError('트랙을 선택해주세요.')
      return
    }
    if (voteType === 'class' && !selectedCarClass) {
      setError('차량 클래스를 선택해주세요.')
      return
    }
    if (voteType === 'all' && (!selectedTrack || !selectedCarClass)) {
      setError('트랙과 차량 클래스를 모두 선택해주세요.')
      return
    }

    try {
      setVoting(true)
      setError('')

      // voteType에 따라 다른 데이터 전송
      const requestBody: {
        week_number?: number
        year?: number
        track_option?: string
        car_class_option?: string
      } = {
        week_number: voteData?.weekInfo.week,
        year: voteData?.weekInfo.year
      }

      if (voteType === 'track' || voteType === 'all') {
        requestBody.track_option = selectedTrack
      }
      if (voteType === 'class' || voteType === 'all') {
        requestBody.car_class_option = selectedCarClass
      }

      const response = await fetch(`/api/regular-events/${regularEventId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">투표 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="text-red-500 text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchVoteData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (!voteData) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="text-gray-500 text-center">
          <p>투표 데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const { voteOptions, userVote, participantCount, votingClosed, weekInfo } = voteData

  return (
    <div className="space-y-4">
      {/* 헤더 정보 (voteType이 'all'일 때만 표시) */}
      {voteType === 'all' && (
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
      )}

      <div className="space-y-4">
        {/* 트랙 선택 (voteType이 'track' 또는 'all'일 때만 표시) */}
        {(voteType === 'track' || voteType === 'all') && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">트랙</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>1개 선택</span>
                <span>|</span>
                <span>모두 가능</span>
                <span>|</span>
                <span>{weekInfo.year}.{String(weekInfo.week).padStart(2, '0')}.17 22:30 까지</span>
              </div>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">{participantCount}</span>명 참여
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                결과 미리보기
                <span className="text-xs">▶</span>
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {voteOptions.tracks.map((track) => {
                const maxVotes = Math.max(...voteOptions.tracks.map(t => t.votes_count), 1)
                const percentage = (track.votes_count / maxVotes) * 100
                const isSelected = selectedTrack === track.option_value
                
                return (
                  <label 
                    key={track.option_value} 
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${votingClosed ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{track.option_value}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">({track.votes_count}표)</span>
                        <input
                          type="radio"
                          name="track"
                          value={track.option_value}
                          checked={isSelected}
                          onChange={(e) => setSelectedTrack(e.target.value)}
                          disabled={votingClosed}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* 가로 바차트 */}
                    {track.votes_count > 0 && (
                      <div className="mt-3 relative w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 font-medium">
                          {Math.round(percentage)}%
                        </div>
                      </div>
                    )}
                  </label>
                )
              })}
            </div>
            
            {voteType === 'track' && (
              <div className="flex justify-end gap-2">
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <span className="text-gray-600">↗</span>
                </button>
                <button
                  onClick={handleVote}
                  disabled={voting || !selectedTrack || votingClosed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {voting ? '투표 중...' : '트랙 투표하기'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 차량 클래스 선택 (voteType이 'class' 또는 'all'일 때만 표시) */}
        {(voteType === 'class' || voteType === 'all') && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">클래스</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>1개 선택</span>
                <span>|</span>
                <span>모두 가능</span>
                <span>|</span>
                <span>{weekInfo.year}.{String(weekInfo.week).padStart(2, '0')}.17 22:30 까지</span>
              </div>
            </div>
            
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">{participantCount}</span>명 참여
              </span>
              <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                결과 미리보기
                <span className="text-xs">▶</span>
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              {voteOptions.carClasses.map((carClass) => {
                const maxVotes = Math.max(...voteOptions.carClasses.map(c => c.votes_count), 1)
                const percentage = (carClass.votes_count / maxVotes) * 100
                const isSelected = selectedCarClass === carClass.option_value
                
                return (
                  <label 
                    key={carClass.option_value} 
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${votingClosed ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{carClass.option_value}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">({carClass.votes_count}표)</span>
                        <input
                          type="radio"
                          name="carClass"
                          value={carClass.option_value}
                          checked={isSelected}
                          onChange={(e) => setSelectedCarClass(e.target.value)}
                          disabled={votingClosed}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* 가로 바차트 */}
                    {carClass.votes_count > 0 && (
                      <div className="mt-3 relative w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 font-medium">
                          {Math.round(percentage)}%
                        </div>
                      </div>
                    )}
                  </label>
                )
              })}
            </div>
            
            {voteType === 'class' && (
              <div className="flex justify-end gap-2">
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <span className="text-gray-600">↗</span>
                </button>
                <button
                  onClick={handleVote}
                  disabled={voting || !selectedCarClass || votingClosed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {voting ? '투표 중...' : '클래스 투표하기'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 투표 버튼 (voteType이 'all'일 때만 표시) */}
        {voteType === 'all' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            {votingClosed ? (
              <div className="text-center py-4">
                <div className="text-red-500 font-semibold mb-2">🔒 투표가 종료되었습니다</div>
                <p className="text-gray-500 text-sm">이벤트 작성자가 투표를 재개할 때까지 기다려주세요.</p>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <span className="text-gray-600">↗</span>
                </button>
                <button
                  onClick={handleVote}
                  disabled={voting || !selectedTrack || !selectedCarClass || votingClosed}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {voting ? '투표 중...' : userVote ? '투표 변경하기' : '전체 투표하기'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 현재 투표 상태 */}
        {userVote && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800 text-center">
              {voteType === 'track' && (
                <>현재 트랙 투표: <span className="font-semibold">{userVote.track_option}</span></>
              )}
              {voteType === 'class' && (
                <>현재 클래스 투표: <span className="font-semibold">{userVote.car_class_option}</span></>
              )}
              {voteType === 'all' && (
                <>현재 투표: <span className="font-semibold">{userVote.track_option}</span> + <span className="font-semibold">{userVote.car_class_option}</span></>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
