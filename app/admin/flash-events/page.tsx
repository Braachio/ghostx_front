'use client'

import { useState, useEffect } from 'react'
import { MultiWithTemplate } from '@/types/events'
import { getDateFromWeekAndDay } from '@/app/utils/weekUtils'

export default function FlashEventsPage() {
  const [events, setEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchFlashEvents()
  }, [])

  const fetchFlashEvents = async () => {
    try {
      const response = await fetch('/api/multis')
      if (response.ok) {
        const data = await response.json()
        // 기습갤멀만 필터링
        const flashEvents = data.filter((event: MultiWithTemplate) => 
          event.event_type === 'flash_event' || !event.event_type
        )
        setEvents(flashEvents)
      } else {
        console.error('기습갤멀 조회 실패:', response.statusText)
      }
    } catch (error) {
      console.error('기습갤멀 조회 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 기습갤멀을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/multis/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchFlashEvents()
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('기습갤멀 삭제 에러:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p>기습갤멀을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">⚡ 기습갤멀 관리</h1>
          <p className="text-gray-400">일회성 갤러리 멀티플레이 이벤트를 관리합니다.</p>
        </div>

        {/* 액션 버튼 */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            ⚡ 새 기습갤멀 추가
          </button>
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">기습갤멀이 없습니다</h3>
              <p className="text-gray-400 mb-4">첫 번째 기습갤멀을 추가해보세요!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                기습갤멀 추가하기
              </button>
            </div>
          ) : (
            events.map((event) => (
              <FlashEventCard 
                key={event.id} 
                event={event} 
                onDelete={handleDelete}
                onUpdate={fetchFlashEvents}
              />
            ))
          )}
        </div>

        {/* 새 기습갤멀 생성 폼 */}
        {showCreateForm && (
          <CreateFlashEventForm 
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false)
              fetchFlashEvents()
            }}
          />
        )}
      </div>
    </div>
  )
}

// 기습갤멀 카드 컴포넌트
function FlashEventCard({ 
  event, 
  onDelete, 
  onUpdate 
}: { 
  event: MultiWithTemplate
  onDelete: (id: string) => void
  onUpdate: () => void 
}) {
  const [editing, setEditing] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getEventDate = () => {
    if (event.event_date) {
      return formatDate(event.event_date)
    }
    
    if (event.year && event.week) {
      // 주차 기반 날짜 계산
      const firstDay = event.multi_day[0]
      if (firstDay) {
        const eventDate = getDateFromWeekAndDay(event.year, event.week, firstDay)
        if (eventDate) {
          return formatDate(eventDate.toISOString())
        }
      }
    }
    
    return '날짜 미정'
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚡</span>
            <h3 className="text-xl font-bold text-white">{event.title}</h3>
            {event.is_open ? (
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                공개
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                비공개
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <span className="text-gray-400">게임:</span> {event.game}
            </div>
            <div>
              <span className="text-gray-400">트랙:</span> {event.game_track}
            </div>
            <div>
              <span className="text-gray-400">클래스:</span> {event.multi_class}
            </div>
            <div>
              <span className="text-gray-400">시간:</span> {event.multi_time || '미정'}
            </div>
            <div>
              <span className="text-gray-400">날짜:</span> {getEventDate()}
            </div>
            <div>
              <span className="text-gray-400">요일:</span> {event.multi_day.join(', ')}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
            title="수정"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors"
            title="삭제"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {event.description && (
        <div className="mb-4">
          <p className="text-gray-300 text-sm">{event.description}</p>
        </div>
      )}
      
      {event.link && (
        <div className="mb-4">
          <a 
            href={event.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 text-sm underline"
          >
            🔗 갤러리 링크
          </a>
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        생성: {event.created_at ? formatDate(event.created_at) : '알 수 없음'}
      </div>

      {editing && (
        <EditFlashEventForm
          event={event}
          onClose={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

// 기습갤멀 생성 폼 컴포넌트
function CreateFlashEventForm({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    title: '',
    game: '',
    game_track: '',
    multi_class: '',
    multi_time: '',
    multi_day: [] as string[],
    description: '',
    link: '',
    is_open: true,
    event_type: 'flash_event',
    year: new Date().getFullYear(),
    week: Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.game.trim() || !formData.game_track.trim() || formData.multi_day.length === 0) {
      alert('제목, 게임, 트랙, 요일은 필수입니다.')
      return
    }
    
    try {
      const response = await fetch('/api/multis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || '생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('기습갤멀 생성 에러:', error)
      alert('생성 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">⚡ 새 기습갤멀 추가</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                게임 *
              </label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">게임 선택</option>
                <option value="아세토코르사">아세토코르사</option>
                <option value="컴페티치오네">컴페티치오네</option>
                <option value="그란투리스모7">그란투리스모7</option>
                <option value="르망얼티밋">르망얼티밋</option>
                <option value="EA WRC">EA WRC</option>
                <option value="아이레이싱">아이레이싱</option>
                <option value="오토모빌리스타2">오토모빌리스타2</option>
                <option value="F1 25">F1 25</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                트랙 *
              </label>
              <input
                type="text"
                value={formData.game_track}
                onChange={(e) => setFormData({ ...formData, game_track: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                클래스
              </label>
              <input
                type="text"
                value={formData.multi_class}
                onChange={(e) => setFormData({ ...formData, multi_class: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                시간
              </label>
              <input
                type="text"
                value={formData.multi_time}
                onChange={(e) => setFormData({ ...formData, multi_time: e.target.value })}
                placeholder="예: 20:00 ~ 23:00"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                공개 여부
              </label>
              <select
                value={formData.is_open ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_open: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              요일 *
            </label>
            <div className="flex flex-wrap gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.multi_day.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, multi_day: [...formData.multi_day, day] })
                      } else {
                        setFormData({ ...formData, multi_day: formData.multi_day.filter(d => d !== day) })
                      }
                    }}
                    className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              갤러리 링크 (선택사항)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 기습갤멀 수정 폼 컴포넌트 (CreateFlashEventForm과 유사하지만 기존 데이터로 초기화)
function EditFlashEventForm({ 
  event, 
  onClose, 
  onSuccess 
}: { 
  event: MultiWithTemplate
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    title: event.title,
    game: event.game,
    game_track: event.game_track,
    multi_class: event.multi_class,
    multi_time: event.multi_time || '',
    multi_day: event.multi_day,
    description: event.description || '',
    link: event.link || '',
    is_open: event.is_open || false,
    event_type: event.event_type,
    year: event.year || new Date().getFullYear(),
    week: event.week || Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.game.trim() || !formData.game_track.trim() || formData.multi_day.length === 0) {
      alert('제목, 게임, 트랙, 요일은 필수입니다.')
      return
    }
    
    try {
      const response = await fetch(`/api/multis/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || '수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('기습갤멀 수정 에러:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  // CreateFlashEventForm과 동일한 폼 구조, 단지 초기값만 다름
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">⚡ 기습갤멀 수정</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CreateFlashEventForm과 동일한 폼 필드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                게임 *
              </label>
              <select
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">게임 선택</option>
                <option value="아세토코르사">아세토코르사</option>
                <option value="컴페티치오네">컴페티치오네</option>
                <option value="그란투리스모7">그란투리스모7</option>
                <option value="르망얼티밋">르망얼티밋</option>
                <option value="EA WRC">EA WRC</option>
                <option value="아이레이싱">아이레이싱</option>
                <option value="오토모빌리스타2">오토모빌리스타2</option>
                <option value="F1 25">F1 25</option>
              </select>
            </div>
          </div>

          {/* 나머지 필드들도 동일... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                트랙 *
              </label>
              <input
                type="text"
                value={formData.game_track}
                onChange={(e) => setFormData({ ...formData, game_track: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                클래스
              </label>
              <input
                type="text"
                value={formData.multi_class}
                onChange={(e) => setFormData({ ...formData, multi_class: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                시간
              </label>
              <input
                type="text"
                value={formData.multi_time}
                onChange={(e) => setFormData({ ...formData, multi_time: e.target.value })}
                placeholder="예: 20:00 ~ 23:00"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                공개 여부
              </label>
              <select
                value={formData.is_open ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_open: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              요일 *
            </label>
            <div className="flex flex-wrap gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.multi_day.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, multi_day: [...formData.multi_day, day] })
                      } else {
                        setFormData({ ...formData, multi_day: formData.multi_day.filter(d => d !== day) })
                      }
                    }}
                    className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-white">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              갤러리 링크 (선택사항)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              수정
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
