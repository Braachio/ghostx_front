'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { TELEMETRY_ENABLED } from '@/lib/featureFlags'

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

interface TopNavigationProps {
  user: User | null
  language: 'ko' | 'en'
  onLanguageChange: (lang: 'ko' | 'en') => void
  onLogout: () => void
}

export default function TopNavigation({
  user,
  language,
  onLanguageChange,
  onLogout,
}: TopNavigationProps) {
  const pathname = usePathname()
  const isMainPage = pathname === '/'
  const isIracingPage = pathname?.startsWith('/iracing')
  const isTelemetryPage = pathname?.startsWith('/telemetry')

  const translations = {
    ko: {
      title: 'GPX',
      logout: '로그아웃',
      getStarted: '시작하기',
      toMain: '← 메인으로',
      menu: {
        calendar: '캘린더',
        telemetry: '주행 분석',
        chat: '채팅 채널',
        manage: '갤멀 관리',
      },
    },
    en: {
      title: 'GPX',
      logout: 'Logout',
      getStarted: 'Get Started',
      toMain: '← To Main',
      menu: {
        calendar: 'Calendar',
        telemetry: 'Telemetry',
        chat: 'Chat Channels',
        manage: 'Manage Events',
      },
    },
  } as const

  const t = translations[language]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {t.title}
              </span>
            </Link>

            {/* 왼쪽 메뉴: 캘린더 / iRacing / 주행 분석 (Vercel 탭 스타일) */}
            <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors relative pb-2 ${
                isMainPage 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              {t.menu.calendar}
              {isMainPage && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </Link>
            <Link 
              href="/iracing" 
              className={`text-sm font-medium transition-colors relative pb-2 ${
                isIracingPage 
                  ? 'text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              아이레이싱
              {isIracingPage && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </Link>
            {TELEMETRY_ENABLED && (
              <Link 
                href="/telemetry" 
                className={`text-sm font-medium transition-colors relative pb-2 ${
                  isTelemetryPage 
                    ? 'text-white' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
              {t.menu.telemetry}
                {isTelemetryPage && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
                )}
              </Link>
            )}
            {/* AI 훈련 - 나중에 구현 */}
            {/* <Link 
              href="/training"
              className={`text-sm font-medium transition-colors relative pb-2 ${
                isTrainingPage
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              AI 훈련
              {isTrainingPage && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </Link> */}
            </div>
          </div>

          {/* 오른쪽 메뉴 */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* 프로필 & 로그인/로그아웃 */}
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden md:flex text-sm text-cyan-400 hover:text-cyan-300 transition-colors items-center gap-2"
                >
                  <span>👤</span>
                  <span>{user.nickname}</span>
                  <span className="text-xs opacity-70">→</span>
                </Link>
                <button
                  onClick={onLogout}
                  className="hidden md:block text-white text-sm font-medium hover:text-red-400 transition-colors"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-white text-sm font-medium hover:text-cyan-400 transition-colors"
              >
                {t.getStarted}
              </Link>
            )}

            {/* 언어 전환 */}
            <div className="flex bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => onLanguageChange('ko')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'ko' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇰🇷
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  language === 'en' 
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🇺🇸
              </button>
            </div>

            {/* 메인으로 버튼 (선택적) */}
            <Link
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              {t.toMain}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

