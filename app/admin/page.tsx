'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EventTemplate } from '@/types/events'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    templates: 0,
    flashEvents: 0,
    activeTemplates: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 템플릿 통계
      const templatesResponse = await fetch('/api/event-templates')
      const templates = templatesResponse.ok ? await templatesResponse.json() : []
      
      // 기습갤멀 통계
      const eventsResponse = await fetch('/api/multis')
      const events = eventsResponse.ok ? await eventsResponse.json() : []
      
      const flashEvents = events.filter((event: EventTemplate) => 
        event.event_type === 'flash_event' || !event.event_type
      )
      
      setStats({
        templates: templates.length,
        flashEvents: flashEvents.length,
        activeTemplates: templates.filter((t: EventTemplate) => t.is_active).length
      })
    } catch (error) {
      console.error('통계 조회 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      href: '/admin/event-templates',
      icon: '🎯',
      title: '템플릿 관리',
      description: '정기 스케줄, 상시 서버, 리그 템플릿을 관리합니다.',
      color: 'blue'
    },
    {
      href: '/admin/flash-events',
      icon: '⚡',
      title: '기습갤멀 관리',
      description: '일회성 갤러리 멀티플레이 이벤트를 관리합니다.',
      color: 'orange'
    },
    {
      href: '/admin/schedule',
      icon: '📅',
      title: '스케줄 뷰',
      description: '전체 스케줄을 통합하여 확인합니다.',
      color: 'green'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>대시보드를 불러오는 중...</p>
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
          <h1 className="text-3xl font-bold text-white mb-2">🎛️ 관리자 대시보드</h1>
          <p className="text-gray-400">이벤트 관리 시스템에 오신 것을 환영합니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{stats.templates}</h3>
                <p className="text-gray-400">총 템플릿</p>
                <p className="text-sm text-blue-400">{stats.activeTemplates}개 활성</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{stats.flashEvents}</h3>
                <p className="text-gray-400">기습갤멀</p>
                <p className="text-sm text-orange-400">일회성 이벤트</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{stats.templates + stats.flashEvents}</h3>
                <p className="text-gray-400">총 이벤트</p>
                <p className="text-sm text-green-400">전체 관리 대상</p>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-${action.color}-500 transition-all hover:shadow-lg hover:shadow-${action.color}-500/20`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-${action.color}-600 rounded-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{action.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{action.title}</h3>
                    <p className="text-gray-400 text-sm">{action.description}</p>
                  </div>
                  <div className={`text-${action.color}-400 group-hover:translate-x-1 transition-transform`}>
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">시스템 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🎯 템플릿 시스템</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 정기 스케줄: 매주 반복되는 이벤트</li>
                <li>• 상시 서버: 24시간 운영 서버</li>
                <li>• 리그: 정기 리그 이벤트</li>
                <li>• 템플릿 기반으로 자동 생성</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">⚡ 기습갤멀</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 일회성 갤러리 멀티플레이</li>
                <li>• 완전 커스텀 이벤트</li>
                <li>• 수동으로 생성 및 관리</li>
                <li>• 임시 공지 및 이벤트</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
