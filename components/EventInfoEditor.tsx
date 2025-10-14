'use client'

import { useState } from 'react'

interface EventInfo {
  id: string
  title: string
  description: string | null
  multi_day: string[]
  start_time: string
  duration_hours: number
  max_participants: number
  is_open: boolean
}

interface EventInfoEditorProps {
  event: EventInfo
  isAuthor: boolean
  onUpdate: (updatedEvent: EventInfo) => void
}

export default function EventInfoEditor({ event, isAuthor, onUpdate }: EventInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || '',
    multi_day: event.multi_day,
    start_time: event.start_time,
    duration_hours: event.duration_hours,
    max_participants: event.max_participants,
    is_open: event.is_open
  })

  const dayOptions = ['일', '월', '화', '수', '목', '금', '토']

  const handleSave = async () => {
    try {
      setEditing(true)
      setError(null)

      const response = await fetch(`/api/regular-events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        onUpdate(data.event)
        setIsEditing(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || '이벤트 수정에 실패했습니다.')
      }
    } catch (err) {
      console.error('Failed to update event:', err)
      setError(err instanceof Error ? err.message : '이벤트 수정에 실패했습니다.')
    } finally {
      setEditing(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: event.title,
      description: event.description || '',
      multi_day: event.multi_day,
      start_time: event.start_time,
      duration_hours: event.duration_hours,
      max_participants: event.max_participants,
      is_open: event.is_open
    })
    setIsEditing(false)
    setError(null)
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      multi_day: prev.multi_day.includes(day)
        ? prev.multi_day.filter(d => d !== day)
        : [...prev.multi_day, day]
    }))
  }

  if (!isAuthor) {
    return null
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">✏️ 이벤트 정보 관리</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            수정하기
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="이벤트 설명을 입력하세요"
            />
          </div>

          {/* 요일 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">요일</label>
            <div className="flex gap-2">
              {dayOptions.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.multi_day.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* 시작 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">시작 시간</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* 지속시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">지속시간 (시간)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={formData.duration_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* 최대 참가자 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">최대 참가자 수</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.max_participants}
              onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            />
          </div>

          {/* 이벤트 상태 */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_open}
                onChange={(e) => setFormData(prev => ({ ...prev, is_open: e.target.checked }))}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
              />
              <span className="text-sm font-medium text-gray-300">이벤트 활성화</span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={editing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editing ? '저장 중...' : '저장'}
            </button>
            <button
              onClick={handleCancel}
              disabled={editing}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-400">제목:</span>
            <span className="ml-2 text-white">{event.title}</span>
          </div>
          {event.description && (
            <div>
              <span className="text-sm text-gray-400">설명:</span>
              <span className="ml-2 text-white">{event.description}</span>
            </div>
          )}
          <div>
            <span className="text-sm text-gray-400">요일:</span>
            <span className="ml-2 text-white">{event.multi_day.join(', ')}</span>
          </div>
          <div>
            <span className="text-sm text-gray-400">시작 시간:</span>
            <span className="ml-2 text-white">{event.start_time}</span>
          </div>
          <div>
            <span className="text-sm text-gray-400">지속시간:</span>
            <span className="ml-2 text-white">{event.duration_hours}시간</span>
          </div>
          <div>
            <span className="text-sm text-gray-400">최대 참가자:</span>
            <span className="ml-2 text-white">{event.max_participants}명</span>
          </div>
          <div>
            <span className="text-sm text-gray-400">상태:</span>
            <span className={`ml-2 ${event.is_open ? 'text-green-400' : 'text-red-400'}`}>
              {event.is_open ? '활성화' : '비활성화'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
