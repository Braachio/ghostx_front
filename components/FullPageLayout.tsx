'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import EventCalendar from './EventCalendar'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface FullPageLayoutProps {
  user: any
  language: 'ko' | 'en'
  views: number | null
  events: Multi[]
  eventsLoading: boolean
  selectedGame: string
  onGameChange: (game: string) => void
  onLanguageChange: (lang: 'ko' | 'en') => void
  onLogout: () => void
}

export default function FullPageLayout({
  user,
  language,
  views,
  events,
  eventsLoading,
  selectedGame,
  onGameChange,
  onLanguageChange,
  onLogout
}: FullPageLayoutProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        scrollToSection(currentSection + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        scrollToSection(currentSection - 1)
      } else if (e.key === 'Home') {
        e.preventDefault()
        scrollToSection(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        scrollToSection(3)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentSection])

  const scrollToSection = (sectionIndex: number) => {
    const sections = document.querySelectorAll('.fullpage-section')
    if (sections[sectionIndex]) {
      sections[sectionIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      setCurrentSection(sectionIndex)
    }
  }

  const t = {
    ko: {
      title: 'Ghost-X',
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
      mobileMenu: '메뉴',
      scrollHint: '스크롤하여 더 보기',
      keyboardHint: '키보드 화살표로 네비게이션'
    },
    en: {
      title: 'Ghost-X',
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
      mobileMenu: 'Menu',
      scrollHint: 'Scroll to see more',
      keyboardHint: 'Use arrow keys to navigate'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white overflow-x-hidden">
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
              <Image 
                src="/logo/ghost-x-symbol.svg" 
                alt="Ghost-X" 
                width={32} 
                height={32} 
                className="dark:invert" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {t[language].title}
              </span>
            </Link>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center gap-4">
              {/* 섹션 네비게이션 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollToSection(0)}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  👻 소개
                </button>
                <button
                  onClick={() => scrollToSection(1)}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  🗓️ 캘린더
                </button>
                <button
                  onClick={() => scrollToSection(2)}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  🏁 이벤트
                </button>
                <button
                  onClick={() => scrollToSection(3)}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  👤 프로필
                </button>
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
                      👤 {t[language].welcome(user.nickname)}
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

      {/* Section 1: Ghost-X 소개 섹션 */}
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center">
          {/* Ghost-X 브랜딩 */}
          <div className="mb-16">
            <div className="inline-block mb-8">
              <div className="text-8xl sm:text-9xl animate-pulse">👻</div>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-8">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t[language].title}
              </span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-white">
              {language === 'ko' ? (
                <>심레이싱 갤러리 멀티 일정 통합 관리 시스템</>
              ) : (
                <>Sim Racing Gallery Multi Schedule Management System</>
              )}
            </h2>
            <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              {language === 'ko' ? (
                <>정기 갤멀부터 기습 갤멀, 리그 운영, 상시 서버까지<br />모든 레이싱 이벤트를 한 곳에서 효율적으로 관리하세요</>
              ) : (
                <>From regular gallery multis to flash events, league operations, and always-on servers<br />Manage all racing events efficiently in one place</>
              )}
            </p>
            <div className="h-px w-96 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-8"></div>
          </div>

          {/* 주요 기능 소개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-cyan-500/30">
              <div className="text-4xl mb-4">🗓️</div>
              <h3 className="text-xl font-bold mb-3 text-cyan-400">갤멀 일정 관리</h3>
              <p className="text-gray-300 text-sm">
                {language === 'ko' ? '정기/기습 갤멀 일정을 캘린더로 관리' : 'Manage regular/flash gallery schedules with calendar'}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-3 text-green-400">리그 운영</h3>
              <p className="text-gray-300 text-sm">
                {language === 'ko' ? '정식 리그 시스템으로 공식 레이싱 이벤트 운영' : 'Official racing events with formal league system'}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-orange-500/30">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-3 text-orange-400">상시 서버</h3>
              <p className="text-gray-300 text-sm">
                {language === 'ko' ? '24시간 언제든 접속 가능한 상시 운영 서버' : '24/7 always-on server accessible anytime'}
              </p>
            </div>
          </div>

          {/* 스크롤 힌트 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-center">
              <div className="text-2xl mb-2">⬇️</div>
              <p className="text-sm text-gray-400">{t[language].scrollHint}</p>
              <p className="text-xs text-gray-500 mt-1">{t[language].keyboardHint}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 캘린더 섹션 */}
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🗓️ {t[language].gallerySchedule}
            </h2>
            <p className="text-lg text-gray-400">
              {language === 'ko' ? '모든 갤멀 일정을 한눈에 확인하세요' : 'View all gallery multi schedules at a glance'}
            </p>
          </div>
          
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

      {/* Section 3: 이벤트 카테고리 섹션 */}
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 - 체크 플래그와 타이틀 */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="text-7xl animate-pulse">🏁</div>
            </div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              RACING EVENTS
            </h2>
            <p className="text-gray-400 text-lg">
              {language === 'ko' ? '참여할 멀티 이벤트를 선택하세요' : 'Select the multi-event you want to participate in'}
            </p>
            <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          {/* 정기 멀티 - 상단 전체 폭 */}
          <div className="mb-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-400/60 transition-all duration-300">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                    정기 멀티
                  </h3>
                  <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                    {language === 'ko' ? '매주 정해진 시간에 열리는 정규 레이싱 이벤트' : 'Regular racing events held at a fixed time every week'}
                  </p>
                  <div className="inline-block mb-6 px-4 py-2 bg-blue-900/30 rounded-full border border-blue-500/30">
                    <span className="text-blue-300 text-sm font-semibold">게임별 전용 페이지</span>
                  </div>
                </div>
                
                {/* 게임별 버튼 - 가로 한줄 */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Link 
                    href="/events/regular/iracing" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> 아이레이싱</span>
                  </Link>
                  <Link 
                    href="/events/regular/assettocorsa" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> 아세토코르사</span>
                  </Link>
                  <Link 
                    href="/events/regular/gran-turismo7" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> 그란투리스모7</span>
                  </Link>
                  <Link 
                    href="/events/regular/competizione" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> 컴페티치오네</span>
                  </Link>
                  <Link 
                    href="/events/regular/lemans" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> 르망얼티밋</span>
                  </Link>
                  <Link 
                    href="/events/regular/f1-25" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> F1 25</span>
                  </Link>
                  <Link 
                    href="/events/regular/automobilista2" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10"> 오토모빌리스타2</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 다른 이벤트 타입들 - 하단 3개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 상시 서버 */}
            <Link href="/events/always-on" className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-green-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-green-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-5xl mb-4">🌐</div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-3">
                    상시 서버
                  </h3>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    {language === 'ko' ? (
                      <>24시간 언제든 접속 가능한<br />상시 운영 서버</>
                    ) : (
                      <>Always-on server accessible<br />24 hours a day, anytime</>
                    )}
                  </p>
                  <div className="inline-block px-4 py-2 bg-green-900/30 rounded-full border border-green-500/30">
                    <span className="text-green-300 text-sm font-semibold">모든 게임 통합 페이지</span>
                  </div>
                  
                  {/* 호버 효과 */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-green-400 text-sm font-semibold">
                      클릭하여 입장 →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* 리그 */}
            <Link href="/events/league" className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                    리그
                  </h3>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    {language === 'ko' ? (
                      <>정식 리그 시스템으로 운영되는<br />공식 레이싱 이벤트</>
                    ) : (
                      <>Official racing events operated<br />with a formal league system</>
                    )}
                  </p>
                  <div className="inline-block px-4 py-2 bg-purple-900/30 rounded-full border border-purple-500/30">
                    <span className="text-purple-300 text-sm font-semibold">모든 게임 통합 페이지</span>
                  </div>
                  
                  {/* 호버 효과 */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-purple-400 text-sm font-semibold">
                      클릭하여 입장 →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* 기습 갤멀 */}
            <Link href="/multis" className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-orange-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-orange-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-5xl mb-4">⚡</div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
                    기습 갤멀
                  </h3>
                  <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                    {language === 'ko' ? (
                      <>예고 없이 갑작스럽게 열리는<br />일회성 레이싱 이벤트</>
                    ) : (
                      <>One-time racing events that open<br />suddenly without notice</>
                    )}
                  </p>
                  <div className="inline-block px-4 py-2 bg-orange-900/30 rounded-full border border-orange-500/30">
                    <span className="text-orange-300 text-sm font-semibold">시간 기반 필터링</span>
                  </div>
                  
                  {/* 호버 효과 */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-orange-400 text-sm font-semibold animate-pulse">
                      지금 참가하기 →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="mt-16 text-center">
            <div className="inline-block p-6 bg-gray-900/50 border border-gray-700 rounded-xl backdrop-blur-sm">
              <p className="text-gray-400 text-sm">
                💡 <span className="text-cyan-400 font-semibold">팁:</span> 각 이벤트 유형을 클릭하여 상세 일정을 확인하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: 프로필 섹션 */}
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              👤 사용자 프로필
            </h2>
            <p className="text-lg text-gray-400">
              {language === 'ko' ? 'Steam 프로필과 게임 통계를 확인하세요' : 'Check your Steam profile and game statistics'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Steam 프로필 카드 */}
            {user ? (
              <Link href="/profile" className="group">
                <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105">
                  <div className="text-center">
                    <div className="text-6xl mb-6">🎮</div>
                    <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Steam 프로필
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {language === 'ko' ? '레이싱 게임 통계와 업적 현황' : 'Racing game statistics and achievements'}
                    </p>
                    <div className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      프로필 보기 →
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/login" className="group">
                <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105">
                  <div className="text-center">
                    <div className="text-6xl mb-6">🎮</div>
                    <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Steam 프로필
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">
                      {language === 'ko' ? 'Steam 로그인하고 통계 확인' : 'Login with Steam to view statistics'}
                    </p>
                    <div className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      로그인하기 →
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* 추가 정보 카드 */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-gray-500/40 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-6xl mb-6">🚀</div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {language === 'ko' ? '빠른 시작' : 'Quick Start'}
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {language === 'ko' ? '키보드 화살표로 섹션 간 이동이 가능합니다' : 'Use arrow keys to navigate between sections'}
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>⬆️⬇️ 섹션 이동</div>
                  <div>🏠 홈으로</div>
                  <div>🔚 끝으로</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 네비게이션 도트 */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="space-y-4">
          {[
            { index: 0, label: '소개' },
            { index: 1, label: '캘린더' },
            { index: 2, label: '이벤트' },
            { index: 3, label: '프로필' }
          ].map(({ index, label }) => (
            <button
              key={index}
              onClick={() => scrollToSection(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 group ${
                currentSection === index
                  ? 'bg-cyan-400 scale-125'
                  : 'bg-gray-600 hover:bg-gray-400'
              }`}
              title={label}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
