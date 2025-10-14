'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import VotingPanel from '@/components/VotingPanel'
import ParticipantButton from '@/components/ParticipantButton'
import VotingResultsPanel from '@/components/VotingResultsPanel'
import EventInfoEditor from '@/components/EventInfoEditor'
import VoteOptionsManager from '@/components/VoteOptionsManager'
import { MultiWithTemplate } from '@/types/events'

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

interface RegularEventDetailPageProps {
  params: Promise<{ game: string; id: string }>
}

export default function RegularEventDetailPage({ params }: RegularEventDetailPageProps) {
  const [game, setGame] = useState<string>('')
  const [eventId, setEventId] = useState<string>('')
  const [event, setEvent] = useState<MultiWithTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setGame(resolvedParams.game)
      setEventId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  // 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data: MultiWithTemplate[] = await response.json()
          
          // 해당 ID의 정기 이벤트 찾기
          const foundEvent = data.find(e => e.id === eventId && e.event_type === 'regular_schedule')
          
          if (foundEvent) {
            setEvent(foundEvent)
          } else {
            setError('이벤트를 찾을 수 없습니다.')
          }
        } else {
          setError('이벤트를 불러오는데 실패했습니다.')
        }
      } catch (error) {
        console.error('이벤트 조회 실패:', error)
        setError('이벤트를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  // ON/OFF 토글 함수
  const handleToggle = async () => {
    if (!event || !user || event.user_id !== user.id) return

    setToggling(true)
    try {
      const response = await fetch(`/api/multis?id=${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_open: !event.is_open
        })
      })

      if (response.ok) {
        setEvent(prev => prev ? { ...prev, is_open: !prev.is_open } : null)
      } else {
        console.error('토글 업데이트 실패')
      }
    } catch (error) {
      console.error('토글 업데이트 중 오류:', error)
    } finally {
      setToggling(false)
    }
  }

  // 이벤트 정보 업데이트 핸들러
  const handleEventUpdate = (updatedEvent: Partial<MultiWithTemplate>) => {
    setEvent(prev => prev ? { ...prev, ...updatedEvent } : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-400 text-xl">👻 이벤트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-red-400">❌</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {error || '이벤트를 찾을 수 없습니다'}
          </h3>
          <Link 
            href={`/events/regular/${game}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const gameDisplayName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            {gameDisplayName} 정기 이벤트
          </h1>
          <p className="text-lg text-gray-300">
            매주 반복되는 정규 레이싱 이벤트
          </p>
        </div>

        {/* 네비게이션 */}
        <div className="flex justify-center gap-4 mb-8">
          <Link href={`/events/regular/${game}`}>
            <button className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-semibold">
              ← 목록으로
            </button>
          </Link>
          <Link href="/events">
            <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold">
              🗓️ 다른 이벤트
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이벤트 정보 */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm">

              {/* 이벤트 제목과 상태 */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{event.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-cyan-400">🏁 {event.game}</span>
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                      날짜 미정
                    </span>
                  </div>
                </div>
                {/* ON/OFF 토글 - 작성자만 변경 가능 */}
                {user && event.user_id === user.id ? (
                  <button
                    onClick={handleToggle}
                    disabled={toggling}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 ${
                      event.is_open 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {toggling ? '변경중...' : (event.is_open ? 'ON' : 'OFF')}
                  </button>
                ) : (
                  <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    event.is_open 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {event.is_open ? 'ON' : 'OFF'}
                  </div>
                )}
              </div>

              {/* 상세 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
                  <span className="text-cyan-400 text-xl">🏁</span>
                  <div>
                    <span className="text-gray-400 text-sm">트랙:</span>
                    <span className="text-white font-medium ml-2">{event.game_track}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
                  <span className="text-blue-400 text-xl">🚗</span>
                  <div>
                    <span className="text-gray-400 text-sm">클래스:</span>
                    <span className="text-white font-medium ml-2">{event.multi_class}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
                  <span className="text-purple-400 text-xl">📅</span>
                  <div>
                    <span className="text-gray-400 text-sm">요일:</span>
                    <span className="text-white font-medium ml-2">{event.multi_day?.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-4">
                  <span className="text-yellow-400 text-xl">⏰</span>
                  <div>
                    <span className="text-gray-400 text-sm">시작 시간:</span>
                    <span className="text-white font-medium ml-2">{event.multi_time}</span>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              {event.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">📝 설명</h3>
                  <p className="text-gray-300 leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* 추가 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {event.duration_hours && (
                  <div className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-3">
                    <span className="text-orange-400">⏱️</span>
                    <span className="text-gray-400 text-sm">지속시간:</span>
                    <span className="text-white font-medium">{event.duration_hours}시간</span>
                  </div>
                )}
                {event.max_participants && (
                  <div className="flex items-center gap-3 bg-gray-800/30 rounded-lg p-3">
                    <span className="text-green-400">👥</span>
                    <span className="text-gray-400 text-sm">최대 참가자:</span>
                    <span className="text-white font-medium">{event.max_participants}명</span>
                  </div>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>📅</span>
                  <span>{new Date(event.created_at || '').toLocaleDateString('ko-KR')}</span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(`/events/regular/${game}/${eventId}/chat`, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/25"
                  >
                    💬 익명채팅
                  </button>
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg shadow-blue-500/25"
                    >
                      🔗 참가하기
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 - 참가신청과 투표 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 참가신청 섹션 */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">👥 참가신청</h3>
              <p className="text-gray-400 mb-4 text-sm">
                참가신청을 완료한 사용자만 투표할 수 있습니다.
              </p>
              <ParticipantButton eventId={event.id} />
            </div>

            {/* 투표 패널 */}
            <VotingPanel 
              regularEventId={event.id}
              weekNumber={undefined} // 현재 주차 자동 계산
              year={undefined} // 현재 연도 자동 계산
            />

            {/* 투표 결과 적용 섹션 (이벤트 작성자만) */}
            {user && event.author_id === user.id && (
              <VotingResultsPanel eventId={event.id} />
            )}

            {/* 관리자 섹션 (이벤트 작성자만) */}
            {user && event.author_id === user.id && (
              <div className="space-y-6">
                <EventInfoEditor 
                  event={event} 
                  isAuthor={true} 
                  onUpdate={handleEventUpdate}
                />
                <VoteOptionsManager 
                  eventId={event.id}
                  weekNumber={undefined}
                  year={undefined}
                  isAuthor={true}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
