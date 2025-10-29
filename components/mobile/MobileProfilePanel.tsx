'use client'

import Link from 'next/link'

interface MobileProfilePanelProps {
  user: {
    id: string
    nickname: string
    email: string
    role: string
  } | null
  language: 'ko' | 'en'
  onLogout: () => void
}

export default function MobileProfilePanel({ user, language, onLogout }: MobileProfilePanelProps) {
  if (!user) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">👤</div>
        <h3 className="text-lg font-bold text-white mb-2">{language === 'ko' ? '로그인이 필요합니다' : 'Login required'}</h3>
        <p className="text-gray-400 text-sm mb-4">
          {language === 'ko' ? '프로필을 보려면 로그인하세요.' : 'Please login to view your profile.'}
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <span>🚀</span>
          {language === 'ko' ? '로그인' : 'Login'}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
          {user.nickname?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <div className="text-white text-base font-semibold">{user.nickname}</div>
          <div className="text-gray-400 text-xs">{user.email}</div>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/profile" className="block w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-white transition-colors">
          {language === 'ko' ? '프로필 상세 보기' : 'View full profile'}
        </Link>
        <button onClick={onLogout} className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
          {language === 'ko' ? '로그아웃' : 'Logout'}
        </button>
      </div>
    </div>
  )
}
