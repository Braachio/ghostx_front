'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import EventCalendar from './EventCalendar'
import InterestGameNotificationBanner from './InterestGameNotificationBanner'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

interface FullPageLayoutProps {
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

export default function FullPageLayout({
  user,
  language,
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
        scrollToSection(2)
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

            {/* 사용자 메뉴만 유지 */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* 갤멀 선택하기 버튼 */}
                  <Link
                    href="/events"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                  >
                    🏁 갤멀 선택하기
                    <span className="text-xs">→</span>
                  </Link>

                  {/* 권한에 따른 버튼 표시 */}
                  {user.role === 'admin' || user.role === 'event_manager' ? (
                    <>
                      <Link
                        href="/events/regular/new"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                      >
                        📅 정기 갤멀 생성
                      </Link>
                      <Link
                        href="/multis/new"
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-medium rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30"
                      >
                        ⚡ 기습 갤멀 생성
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/multis/new"
                      className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-medium rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg shadow-orange-500/30"
                    >
                      ⚡ 기습 갤멀 생성
                    </Link>
                  )}
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
                <>심레이싱 게임 갤러리 멀티 일정 통합 관리 시스템</>
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

          {/* 로그인하지 않은 사용자를 위한 시작하기 버튼 */}
          {!user && (
            <div className="text-center mb-16">
              <Link
                href="/login"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white text-lg font-bold rounded-2xl hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
              >
                <span className="text-2xl">🚀</span>
                <span>{t[language].getStarted}</span>
                <span className="text-xl">→</span>
              </Link>
              <p className="text-gray-400 text-sm mt-4">
                {language === 'ko' ? '지금 바로 시작하여 모든 갤멀 일정을 확인하세요!' : 'Start now to check all gallery multi schedules!'}
              </p>
            </div>
          )}

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
            {/* <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🗓️ {t[language].gallerySchedule}
            </h2>
            <p className="text-lg text-gray-400 mb-6">
              {language === 'ko' ? '모든 갤멀 일정을 한눈에 확인하세요' : 'View all gallery multi schedules at a glance'}
            </p> */}
            
          </div>
          
          {/* 관심 게임 알림 배너 */}
          {user && (
            <InterestGameNotificationBanner userId={user.id} />
          )}
          
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

      {/* Section 3: 프로필 섹션 */}
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

      {/* 좌측 세로 네비게이션 */}
      <div className="fixed left-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div className="flex flex-col items-center">
          {[
            { index: 0, label: '소개', icon: '👻' },
            { index: 1, label: '캘린더', icon: '🗓️' },
            { index: 2, label: '프로필', icon: '👤' }
          ].map(({ index, label, icon }, arrayIndex) => (
            <div key={index} className="flex flex-col items-center">
              <button
                onClick={() => scrollToSection(index)}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-300 group ${
                  currentSection === index
                    ? 'text-cyan-400 scale-110'
                    : 'text-gray-400 hover:text-white hover:scale-105'
                }`}
                title={label}
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
              
              {/* 연결점 (마지막 항목 제외) */}
              {arrayIndex < 2 && (
                <div className="flex flex-col items-center my-8">
                  <div className={`w-1 h-8 transition-all duration-300 ${
                    currentSection === index || currentSection === index + 1
                      ? 'bg-cyan-400/60'
                      : 'bg-gray-600/30'
                  }`}></div>
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentSection === index || currentSection === index + 1
                      ? 'bg-cyan-400'
                      : 'bg-gray-600'
                  }`}></div>
                  <div className={`w-1 h-8 transition-all duration-300 ${
                    currentSection === index || currentSection === index + 1
                      ? 'bg-cyan-400/60'
                      : 'bg-gray-600/30'
                  }`}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

