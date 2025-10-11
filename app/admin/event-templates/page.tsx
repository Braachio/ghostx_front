'use client'

import { useState, useEffect } from 'react'
import { EventTemplate, EventType, EventTypeConfig } from '@/types/events'

export default function EventTemplatesPage() {
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<EventType | 'all'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/event-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      } else {
        console.error('템플릿 조회 실패:', response.statusText)
      }
    } catch (error) {
      console.error('템플릿 조회 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = selectedType === 'all' 
    ? templates 
    : templates.filter(t => t.type === selectedType)

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = []
    }
    acc[template.type].push(template)
    return acc
  }, {} as Record<EventType, EventTemplate[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>템플릿을 불러오는 중...</p>
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
          <h1 className="text-3xl font-bold text-white mb-4">🎯 이벤트 템플릿 관리</h1>
          <p className="text-gray-400">정기 스케줄, 상시 서버, 리그 이벤트의 템플릿을 관리합니다.</p>
        </div>

        {/* 필터 및 액션 */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EventType | 'all')}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체</option>
              {Object.entries(EventTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + 새 템플릿 추가
          </button>
        </div>

        {/* 템플릿 목록 */}
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
            <div key={type} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{EventTypeConfig[type as EventType].icon}</span>
                <h2 className="text-xl font-bold text-white">
                  {EventTypeConfig[type as EventType].label}
                </h2>
                <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                  {typeTemplates.length}개
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onUpdate={fetchTemplates}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 새 템플릿 생성 폼 */}
        {showCreateForm && (
          <CreateTemplateForm 
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false)
              fetchTemplates()
            }}
          />
        )}
      </div>
    </div>
  )
}

// 템플릿 카드 컴포넌트
function TemplateCard({ 
  template, 
  onUpdate 
}: { 
  template: EventTemplate
  onUpdate: () => void 
}) {
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/event-templates/${template.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onUpdate()
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('템플릿 삭제 에러:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{template.track}</h3>
          <p className="text-sm text-gray-300 mb-2">{template.game}</p>
          <p className="text-xs text-gray-400">
            {template.class} • {template.time}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="p-1 text-blue-400 hover:text-blue-300"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-400 hover:text-red-300"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {template.days.map((day) => (
            <span 
              key={day} 
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {day}
            </span>
          ))}
        </div>
      </div>
      
      {template.description && (
        <p className="text-xs text-gray-400">{template.description}</p>
      )}

      {editing && (
        <EditTemplateForm
          template={template}
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

// 템플릿 생성 폼 컴포넌트
function CreateTemplateForm({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    type: 'regular_schedule' as EventType,
    game: '',
    track: '',
    class: '',
    time: '',
    days: [] as string[],
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/event-templates', {
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
      console.error('템플릿 생성 에러:', error)
      alert('생성 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">새 템플릿 추가</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                이벤트 타입
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(EventTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                게임
              </label>
              <input
                type="text"
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                트랙
              </label>
              <input
                type="text"
                value={formData.track}
                onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                클래스
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              시간
            </label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="예: 20:00 ~ 23:00"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              요일
            </label>
            <div className="flex flex-wrap gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.days.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, days: [...formData.days, day] })
                      } else {
                        setFormData({ ...formData, days: formData.days.filter(d => d !== day) })
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 템플릿 수정 폼 컴포넌트
function EditTemplateForm({ 
  template, 
  onClose, 
  onSuccess 
}: { 
  template: EventTemplate
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    type: template.type,
    game: template.game,
    track: template.track,
    class: template.class,
    time: template.time,
    days: template.days,
    description: template.description || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/event-templates/${template.id}`, {
        method: 'PUT',
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
      console.error('템플릿 수정 에러:', error)
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">템플릿 수정</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CreateTemplateForm과 동일한 폼 구조 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                이벤트 타입
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(EventTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                게임
              </label>
              <input
                type="text"
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                트랙
              </label>
              <input
                type="text"
                value={formData.track}
                onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                클래스
              </label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              시간
            </label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              placeholder="예: 20:00 ~ 23:00"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              요일
            </label>
            <div className="flex flex-wrap gap-2">
              {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.days.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, days: [...formData.days, day] })
                      } else {
                        setFormData({ ...formData, days: formData.days.filter(d => d !== day) })
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              수정
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
