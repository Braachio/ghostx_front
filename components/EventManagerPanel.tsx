'use client'

import { useState, useEffect } from 'react'
import { X, Play, Pause, Settings, Vote, Users, Calendar } from 'lucide-react'

interface ManagedEvent {
  id: string
  title: string
  game: string
  event_type: string
  event_date: string | null
  multi_time: string | null
  multi_day: string | string[] | null
  is_open: boolean
  created_at: string
  updated_at: string
  author_id: string
  author: {
    nickname: string
  }
  voteOptions: Array<{
    id: string
    option_value: string
    votes_count: number
    voting_closed: boolean
  }>
  voteOptionsCount: number
  totalVotes: number
  votingClosed: boolean
  canManage: boolean
}

interface EventManagerPanelProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function EventManagerPanel({ isOpen, onClose, userId }: EventManagerPanelProps) {
  const [events, setEvents] = useState<ManagedEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  // 내가 관리하는 이벤트 조회
  const fetchManagedEvents = async () => {
    try {
      setLoading(true)
      console.log('관리 이벤트 조회 시작...')
      
      const response = await fetch('/api/my-managed-events')
      
      console.log('API 응답 상태:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API 오류 응답:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: 이벤트 조회에 실패했습니다.`)
      }
      
      const data = await response.json()
      console.log('API 응답 데이터:', data)
      
      setEvents(data.events || [])
      setUserRole(data.userRole || '')
      
      console.log('관리 이벤트 조회 성공:', { 
        eventsCount: data.events?.length || 0,
        userRole: data.userRole 
      })
    } catch (error) {
      console.error('관리 이벤트 조회 실패:', error)
      alert(`이벤트 조회에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  // 이벤트 활성화/비활성화 토글
  const toggleEventActive = async (eventId: string, currentStatus: boolean) => {
    try {
      setUpdating(eventId)
      
      const response = await fetch(`/api/events/${eventId}/toggle-active`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          isActive: !currentStatus
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '이벤트 상태 변경에 실패했습니다.')
      }

      const result = await response.json()
      
      // 로컬 상태 업데이트
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, is_open: !currentStatus }
            : event
        )
      )
      
      alert(result.message)
    } catch (error) {
      console.error('이벤트 상태 변경 실패:', error)
      alert(error instanceof Error ? error.message : '이벤트 상태 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdating(null)
    }
  }

  // 투표 관리 페이지로 이동
  const goToVoteManagement = (eventId: string) => {
    window.open(`/events/regular/${eventId}`, '_blank')
  }

  useEffect(() => {
    if (isOpen && userId) {
      fetchManagedEvents()
    }
  }, [isOpen, userId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              내가 관리하는 갤멀
            </h2>
            {userRole && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {userRole === 'admin' ? '관리자' : userRole === 'event_manager' ? '이벤트 매니저' : '일반 사용자'}
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
              <span className="ml-3 text-gray-600">이벤트를 불러오는 중...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">관리하는 이벤트가 없습니다</h3>
              <p className="text-gray-500">새로운 이벤트를 생성하거나 관리자에게 문의하세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          event.is_open 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.is_open ? '활성' : '비활성'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {event.game}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {event.event_type === 'regular_schedule' 
                              ? `정기 (${event.multi_day})`
                              : event.event_date || '날짜 미정'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>작성자: {event.author.nickname}</span>
                        </div>
                      </div>

                      {/* 투표 정보 */}
                      {event.event_type === 'regular_schedule' && (
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Vote className="w-4 h-4" />
                            <span>투표 옵션: {event.voteOptionsCount}개</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>총 투표: {event.totalVotes}표</span>
                          </div>
                          {event.votingClosed && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              투표 종료
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* 활성화/비활성화 토글 */}
                      <button
                        onClick={() => toggleEventActive(event.id, event.is_open)}
                        disabled={updating === event.id}
                        className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          event.is_open
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updating === event.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : event.is_open ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>비활성화</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>활성화</span>
                          </>
                        )}
                      </button>

                      {/* 투표 관리 (정기 이벤트만) */}
                      {event.event_type === 'regular_schedule' && (
                        <button
                          onClick={() => goToVoteManagement(event.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Vote className="w-4 h-4" />
                          <span>투표 관리</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            총 {events.length}개의 이벤트를 관리 중
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchManagedEvents}
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
