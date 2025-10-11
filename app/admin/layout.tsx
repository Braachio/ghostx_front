'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin/event-templates',
      label: '이벤트 템플릿',
      icon: '🎯',
      description: '정기 스케줄, 상시 서버, 리그 템플릿 관리'
    },
    {
      href: '/admin/flash-events',
      label: '기습갤멀',
      icon: '⚡',
      description: '일회성 갤러리 멀티플레이 이벤트 관리'
    },
    {
      href: '/admin/schedule',
      label: '스케줄 뷰',
      icon: '📅',
      description: '전체 스케줄 통합 뷰'
    },
    {
      href: '/admin/cleanup-events',
      label: '이벤트 정리',
      icon: '🧹',
      description: '종료된 이벤트 상태 자동 정리'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 사이드바 */}
      <div className="fixed left-0 top-0 w-64 h-full bg-gray-800 border-r border-gray-700 overflow-y-auto">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">🎛️ 관리자</h1>
            <p className="text-gray-400 text-sm">이벤트 관리 시스템</p>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block p-4 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="ml-64">
        {children}
      </div>
    </div>
  )
}
