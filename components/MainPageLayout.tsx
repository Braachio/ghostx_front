'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { useUser } from '@/hooks/useUser'
import EventListPage from '@/components/EventListPage'
import EventCalendar from './EventCalendar'
import type { Database } from '@/lib/database.types'
import BrandMark from '@/components/BrandMark'

type Multi = Database['public']['Tables']['multis']['Row']

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

interface MainPageLayoutProps {
  user: User | null
  language: 'ko' | 'en'
  views: number | null
  events: Multi[]
  eventsLoading: boolean
  selectedGame: string
  onGameChange: (game: string) => void
  onLanguageChange: (lang: 'ko' | 'en') => void
  onLogout: () => void
}

export default function MainPageLayout({
  user,
  language,
  events,
  eventsLoading,
  selectedGame,
  onGameChange,
  onLanguageChange,
  onLogout
}: MainPageLayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const t = {
    ko: {
      title: 'GPX',
      welcome: (name: string) => `${name}님 환영합니다`,
      getStarted: '시작하기',
      logout: '로그아웃',
      gallerySchedule: '갤멀 일정',
      regularEvents: '정기 갤멀',
      flashEvents: '기습 갤멀',
      createEvent: '갤멀 생성',
      mainTitle: '갤멀 일정을 한눈에 확인하고',
      mainSubtitle: '참여할 멀티를 선택하세요',
      mainDescription: '정기 갤멀부터 기습 갤멀까지, 모든 레이싱 이벤트를 캘린더로 관리하세요',
      quickActions: '빠른 액션',
      todayEvents: '오늘의 갤멀',
      thisWeekEvents: '이번주 갤멀',
      allEvents: '전체 갤멀',
      gameFilter: '게임별 필터',
      mobileMenu: '메뉴'
    },
    en: {
      title: 'GPX',
      welcome: (name: string) => `Welcome ${name}`,
      getStarted: 'Get Started',
      logout: 'Logout',
      gallerySchedule: 'Gallery Schedule',
      regularEvents: 'Regular Events',
      flashEvents: 'Flash Events',
      createEvent: 'Create Event',
      mainTitle: 'Check Gallery Multi Schedules',
      mainSubtitle: 'and Choose Your Events',
      mainDescription: 'Manage all racing events from regular to flash events with our calendar system',
      quickActions: 'Quick Actions',
      todayEvents: "Today's Events",
      thisWeekEvents: "This Week's Events",
      allEvents: 'All Events',
      gameFilter: 'Game Filter',
      mobileMenu: 'Menu'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* 상단 네비게이션 - 스크롤 시 고정 */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/95 backdrop-blur-md border-b border-gray-800' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-3">
              <BrandMark size={32} textClassName="text-[12px]" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {t[language].title}
              </span>
            </Link>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center gap-4">
              {/* 갤멀 메뉴 */}
              <div className="flex items-center gap-2">
                <Link
                  href="/events"
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  🗓️ {t[language].gallerySchedule}
                </Link>
                <Link
                  href="/events/regular"
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  📅 {t[language].regularEvents}
                </Link>
                <Link
                  href="/multis"
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ⚡ {t[language].flashEvents}
                </Link>
              </div>

              {/* 사용자 메뉴 */}
              <div className="flex items-center gap-3">
                {user ? (
                  <>
                    <Link
                      href="/events/regular/new"
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
                    >
                      ➕ {t[language].createEvent}
                    </Link>
                    <span className="text-sm bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700 text-cyan-400">
                      {t[language].welcome(user.nickname)}
                    </span>
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30"
                    >
                      {t[language].logout}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/50"
                  >
                    {t[language].getStarted}
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
              </div>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden">
              <button className="p-2 text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="pt-16">
        {/* 히어로 섹션 */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            {/* 메인 타이틀 */}
            <div className="mb-12">
              <div className="inline-block mb-8">
                <div className="animate-pulse">
                  <BrandMark size={120} textClassName="text-4xl" className="rounded-3xl" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {t[language].title}
                </span>
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white">
                {language === 'ko' ? (
                  <>갤멀 일정을 한눈에 확인하고<br />참여할 멀티를 선택하세요</>
                ) : (
                  <>Check Gallery Multi Schedules<br />and Choose Your Events</>
                )}
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
                {language === 'ko' ? (
                  <>정기 갤멀부터 기습 갤멀까지, 모든 레이싱 이벤트를 캘린더로 관리하세요</>
                ) : (
                  <>Manage all racing events from regular to flash events with our calendar system</>
                )}
              </p>
              <div className="h-px w-64 sm:w-96 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            </div>

            {/* 빠른 액션 버튼들 */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Link
                href="/events"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
              >
                🗓️ {t[language].gallerySchedule}
              </Link>
              <Link
                href="/events/regular"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
              >
                📅 {t[language].regularEvents}
              </Link>
              <Link
                href="/multis"
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30"
              >
                ⚡ {t[language].flashEvents}
              </Link>
            </div>
          </div>
        </section>

        {/* 캘린더 섹션 */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {eventsLoading ? (
              <div className="bg-gray-900 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">이벤트를 불러오는 중...</p>
              </div>
            ) : (
              <EventCalendar
                events={events}
                selectedGame={selectedGame}
                onGameChange={onGameChange}
              />
            )}
          </div>
        </section>

        {/* 추가 정보 섹션 */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 정기 갤멀 카드 */}
              <Link href="/events/regular" className="group">
                <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-400/60 transition-all duration-300 hover:scale-105">
                  <div className="text-center">
                    <div className="text-5xl mb-4">📅</div>
                    <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {t[language].regularEvents}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {language === 'ko' ? '매주 반복되는 정기 레이싱 이벤트' : 'Weekly recurring racing events'}
                    </p>
                  </div>
                </div>
              </Link>

              {/* 기습 갤멀 카드 */}
              <Link href="/multis" className="group">
                <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-orange-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-orange-400/60 transition-all duration-300 hover:scale-105">
                  <div className="text-center">
                    <div className="text-5xl mb-4">⚡</div>
                    <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      {t[language].flashEvents}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {language === 'ko' ? '예고 없이 갑작스럽게 열리는 일회성 이벤트' : 'Unexpected one-time racing events'}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Steam 프로필 카드 */}
              {user ? (
                <Link href="/profile" className="group">
                  <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <div className="text-5xl mb-4">🎮</div>
                      <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Steam 프로필
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {language === 'ko' ? '레이싱 게임 통계와 업적 현황' : 'Racing game statistics and achievements'}
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href="/login" className="group">
                  <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105">
                    <div className="text-center">
                      <div className="text-5xl mb-4">🎮</div>
                      <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Steam 프로필
                      </h3>
                      <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                        {language === 'ko' ? 'Steam 로그인하고 통계 확인' : 'Login with Steam to view statistics'}
                      </p>
                      <div className="inline-block px-3 py-1 bg-purple-900/30 rounded-full border border-purple-500/30">
                        <span className="text-purple-300 text-xs font-semibold">
                          {language === 'ko' ? '로그인 필요' : 'Login Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
