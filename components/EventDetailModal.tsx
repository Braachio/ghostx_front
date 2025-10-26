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
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    game_track: '',
    multi_class: '',
    multi_time: '',
    duration_hours: 1
  })
  const [isSaving, setIsSaving] = useState(false)
  const [currentDescription, setCurrentDescription] = useState('')
  const [viewCount, setViewCount] = useState(0)

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

  const incrementViewCount = useCallback(async () => {
    if (!event) return
    
    try {
      const response = await fetch(`/api/events/${event.id}/increment-view`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setViewCount(data.view_count || 0)
      }
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }, [event])

  useEffect(() => {
    if (isOpen && event) {
      fetchParticipantCount()
      setCurrentDescription(event.description || '')
      setViewCount(event.views || 0)
      incrementViewCount() // 조회수 증가
    }
  }, [isOpen, event, fetchParticipantCount, incrementViewCount])

  // 이벤트 편집 시작 함수
  const handleEditStart = () => {
    if (!event) return
    setEditForm({
      title: event.title,
      game_track: event.game_track || '',
      multi_class: event.multi_class || '',
      multi_time: event.multi_time || '',
      duration_hours: event.duration_hours || 1
    })
    setIsEditing(true)
  }

  // 이벤트 편집 취소 함수
  const handleEditCancel = () => {
    setIsEditing(false)
    setEditForm({
      title: '',
      game_track: '',
      multi_class: '',
      multi_time: '',
      duration_hours: 1
    })
  }

  // 이벤트 저장 함수
  const handleEditSave = async () => {
    if (!event) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/multis/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        alert('이벤트가 성공적으로 수정되었습니다.')
        setIsEditing(false)
        // 모달을 닫고 새로고침하여 변경사항 반영
        onClose()
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`수정 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('이벤트 수정 오류:', error)
      alert('이벤트 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 이벤트 삭제 함수
  const handleDelete = async () => {
    if (!event) return
    
    const confirmed = confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/multis/${event.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('이벤트가 성공적으로 삭제되었습니다.')
        onClose() // 모달 닫기
        // 페이지 새로고침 또는 이벤트 목록 업데이트
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`삭제 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('이벤트 삭제 오류:', error)
      alert('이벤트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

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
                     조회 {viewCount.toLocaleString()}
                   </div>
                 </div>
              </div>

              {/* 기본 정보 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">🏁트랙</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.game_track}
                      onChange={(e) => setEditForm(prev => ({ ...prev, game_track: e.target.value }))}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      placeholder="트랙명 입력"
                    />
                  ) : (
                    <p className="text-white font-medium">{event.game_track || 'TBD'}</p>
                  )}
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">🏎️클래스</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.multi_class}
                      onChange={(e) => setEditForm(prev => ({ ...prev, multi_class: e.target.value }))}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      placeholder="클래스 입력"
                    />
                  ) : (
                    <p className="text-white font-medium">{event.multi_class || 'TBD'}</p>
                  )}
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">🕗시작 시간</p>
                  {isEditing ? (
                    <input
                      type="time"
                      value={editForm.multi_time}
                      onChange={(e) => setEditForm(prev => ({ ...prev, multi_time: e.target.value }))}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium">{event.multi_time || 'TBD'}</p>
                  )}
                </div>
                
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">⏰지속시간</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editForm.duration_hours}
                      onChange={(e) => setEditForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  ) : (
                    <p className="text-white font-medium">{event.duration_hours ? `${event.duration_hours}시간` : 'TBD'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          {/* 왼쪽 버튼들 */}
          <div className="flex items-center gap-3">
            {isEditing ? (
              /* 편집 모드 버튼들 */
              <>
                <button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-green-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">💾</span>
                  {isSaving ? '저장 중...' : '저장'}
                </button>
                
                <button
                  onClick={handleEditCancel}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-lg hover:shadow-gray-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">❌</span>
                  취소
                </button>
              </>
            ) : (
              /* 일반 모드 버튼들 */
              <>
                {/* 상세정보 버튼 */}
                {event.description && (
                  <button
                    onClick={() => setShowDescriptionModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
                  >
                    <span className="text-lg">📋</span>
                    상세정보
                  </button>
                )}
                
                {/* 수정/삭제 버튼 (작성자나 관리자만) */}
                {((user && event.author_id === user.id) || hasManagementPermission) && (
                  <>
                    <button
                      onClick={handleEditStart}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
                    >
                      <span className="text-lg">✏️</span>
                      수정
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-red-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-lg">🗑️</span>
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          
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
        description={currentDescription}
        eventId={event.id}
        isEditable={((user && event.author_id === user.id) || hasManagementPermission)}
        onUpdate={(newDescription) => {
          setCurrentDescription(newDescription)
          // 페이지 새로고침으로 변경사항 반영
          window.location.reload()
        }}
      />
    </div>
  )
}

