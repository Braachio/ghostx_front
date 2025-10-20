'use client'

interface MobileNavigationProps {
  activeTab: 'calendar' | 'events'
  onTabChange: (tab: 'calendar' | 'events') => void
}

export default function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  return (
    <nav className="mobile-nav bg-gradient-to-t from-slate-900 to-slate-800/95 backdrop-blur-sm border-t border-slate-700/50 shadow-2xl">
      <div className="flex">
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex-1 flex flex-col items-center mobile-py-4 touch-button transition-all duration-300 ${
            activeTab === 'calendar' 
              ? 'text-cyan-400 scale-105' 
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
            activeTab === 'calendar' 
              ? 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25' 
              : 'bg-slate-700/50 hover:bg-slate-600/50'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="mobile-text-xs font-medium">캘린더</span>
        </button>

        <button
          onClick={() => onTabChange('events')}
          className={`flex-1 flex flex-col items-center mobile-py-4 touch-button transition-all duration-300 ${
            activeTab === 'events' 
              ? 'text-cyan-400 scale-105' 
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
            activeTab === 'events' 
              ? 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25' 
              : 'bg-slate-700/50 hover:bg-slate-600/50'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="mobile-text-xs font-medium">이벤트</span>
        </button>

        <button
          onClick={() => {/* 새 이벤트 생성 */}}
          className="flex-1 flex flex-col items-center mobile-py-4 touch-button text-slate-400 hover:text-slate-300 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-slate-700/50 hover:bg-slate-600/50 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="mobile-text-xs font-medium">생성</span>
        </button>

        <button
          onClick={() => {/* 프로필 */}}
          className="flex-1 flex flex-col items-center mobile-py-4 touch-button text-slate-400 hover:text-slate-300 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-slate-700/50 hover:bg-slate-600/50 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="mobile-text-xs font-medium">프로필</span>
        </button>
      </div>
    </nav>
  )
}
