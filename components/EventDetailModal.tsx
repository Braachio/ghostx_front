'use client'

import { useState, useEffect, useCallback } from 'react'
import ParticipationButton from '@/components/ParticipationButton'
import ParticipantListModal from '@/components/ParticipantListModal'
import TrackVotingModal from '@/components/TrackVotingModal'
import EventDescriptionModal from '@/components/EventDescriptionModal'

interface Event {
  id: string
  title: string
  description?: string
  game: string
  game_track?: string
  multi_class?: string
  multi_day?: string[]
  multi_time?: string
  duration_hours?: number
  is_open: boolean
  author_id: string
  link?: string
  voting_enabled?: boolean
  views?: number
}

interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  user: { id: string } | null
  hasManagementPermission: boolean
}

export default function EventDetailModal({ 
  isOpen, 
  onClose, 
  event, 
  user, 
  hasManagementPermission 
}: EventDetailModalProps) {
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [showVotingModal, setShowVotingModal] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  const fetchParticipantCount = useCallback(async () => {
    if (!event) return
    
    try {
      const response = await fetch(`/api/multis/${event.id}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipantCount(data.total || 0)
      }
    } catch (error) {
      console.error('참가자 수 가져오기 실패:', error)
    }
  }, [event])

  useEffect(() => {
    if (isOpen && event) {
      fetchParticipantCount()
    }
  }, [isOpen, event, fetchParticipantCount])

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">{event.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* 통합 이벤트 컨테이너 */}
          <div className="bg-gradient-to-br from-gray-700/90 to-gray-800/90 rounded-2xl p-6 shadow-2xl border border-gray-600 backdrop-blur-sm">
            {/* Steam 로그인 안내문 (로그인되지 않은 경우만) */}
            {!user && (
              <div className="mb-4 text-center">
                <p className="text-gray-400 text-sm">
                  ⚠️참가 신청 및 트랙 투표를 위해서는 Steam 로그인이 필요합니다
                </p>
              </div>
            )}

            {/* 모든 버튼들을 한 줄로 배치 */}
            <div className="flex flex-wrap gap-4 justify-start mb-6">
              {/* 관리자/작성자가 아닌 경우에만 참가신청 버튼 표시 */}
              {!((user && event.author_id === user.id) || hasManagementPermission) && (
                <ParticipationButton 
                  eventId={event.id} 
                  isOwner={false}
                  onParticipationChange={fetchParticipantCount}
                />
              )}


              {/* 트랙투표 버튼 */}
              {event.voting_enabled && (
                <button
                  onClick={() => setShowVotingModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                >
                  <span className="text-lg">🏁</span>
                  트랙 투표하기
                </button>
              )}

              {/* 일반 사용자에게는 참가자 수만 표시, 관리자/작성자에게는 참가자 목록 버튼 표시 */}
              {!((user && event.author_id === user.id) || hasManagementPermission) ? (
                <div className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg flex items-center gap-2 ml-auto">
                  <span className="text-lg">👥</span>
                  참가자: {participantCount}명
                </div>
              ) : (
                <button
                  onClick={() => setShowParticipantModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-lg hover:shadow-gray-500/25 flex items-center gap-2 ml-auto"
                >
                  <span className="text-lg">👥</span>
                  참가자 목록 ({participantCount}명)
                </button>
              )}
            </div>

            {/* 이벤트 정보 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  {/* <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3> */}
                  <div className="flex items-center gap-4 text-gray-400">
                    <span>{event.game}</span>
                    <span>•</span>
                    <span>{event.multi_day?.join(', ') || 'TBD'}</span>
                  </div>
                </div>
                
                 {/* 조회수 표시 */}
                 <div className="text-right">
                   <div className="text-gray-500 text-sm">
                     조회 {event.views !== undefined ? event.views.toLocaleString() : '0'}
                   </div>
                 </div>
              </div>

              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">🏁트랙</p>
                  <p className="text-white font-medium">{event.game_track || 'TBD'}</p>
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">🏎️클래스</p>
                  <p className="text-white font-medium">{event.multi_class || 'TBD'}</p>
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">🕗시작 시간</p>
                  <p className="text-white font-medium">{event.multi_time || 'TBD'}</p>
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">⏰지속시간</p>
                  <p className="text-white font-medium">{event.duration_hours ? `${event.duration_hours}시간` : 'TBD'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          {/* 상세정보 버튼 (왼쪽) */}
          {event.description && (
            <button
              onClick={() => setShowDescriptionModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
            >
              <span className="text-lg">📋</span>
              상세정보
            </button>
          )}
          
          {/* 닫기 버튼 (오른쪽) */}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 서브 모달들 */}
      <ParticipantListModal
        isOpen={showParticipantModal}
        onClose={() => setShowParticipantModal(false)}
        eventId={event.id}
        isOwner={(user && event.author_id === user.id) || hasManagementPermission}
      />

      <TrackVotingModal
        isOpen={showVotingModal}
        onClose={() => setShowVotingModal(false)}
        regularEventId={event.id}
        isOwner={hasManagementPermission}
        game={event.game}
      />

      <EventDescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title={event.title}
        description={event.description || ''}
      />
    </div>
  )
}
