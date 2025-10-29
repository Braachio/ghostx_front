'use client'

interface MobileNavigationProps {
  activeTab: 'calendar' | 'events' | 'chat'
  onTabChange: (tab: 'calendar' | 'events' | 'chat') => void
}

export default function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  return (
    <nav className="mobile-nav">
      <div className="flex">
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex-1 flex flex-col items-center py-3 touch-button transition-all duration-200 ${
            activeTab === 'calendar' 
              ? 'text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className={`w-6 h-6 mb-1 flex items-center justify-center transition-all ${
            activeTab === 'calendar' 
              ? 'scale-110' 
              : ''
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium">캘린더</span>
        </button>

        <button
          onClick={() => onTabChange('events')}
          className={`flex-1 flex flex-col items-center py-3 touch-button transition-all duration-200 ${
            activeTab === 'events' 
              ? 'text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className={`w-6 h-6 mb-1 flex items-center justify-center transition-all ${
            activeTab === 'events' 
              ? 'scale-110' 
              : ''
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-xs font-medium">이벤트</span>
        </button>

        <button
          onClick={() => onTabChange('chat')}
          className={`flex-1 flex flex-col items-center py-3 touch-button transition-all duration-200 ${
            activeTab === 'chat' 
              ? 'text-blue-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className={`w-6 h-6 mb-1 flex items-center justify-center transition-all ${
            activeTab === 'chat' 
              ? 'scale-110' 
              : ''
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-xs font-medium">채팅</span>
        </button>

        <button
          onClick={() => {/* 새 이벤트 생성 */}}
          className="flex-1 flex flex-col items-center py-3 touch-button text-gray-500 hover:text-gray-700 transition-all duration-200"
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-xs font-medium">생성</span>
        </button>

        <button
          onClick={() => {/* 프로필 */}}
          className="flex-1 flex flex-col items-center py-3 touch-button text-gray-500 hover:text-gray-700 transition-all duration-200"
        >
          <div className="w-6 h-6 mb-1 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-xs font-medium">프로필</span>
        </button>
      </div>
    </nav>
  )
}
