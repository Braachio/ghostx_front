'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TopNavigation from './TopNavigation'
import EventCalendar from './EventCalendar'
import InterestGameNotificationBanner from './InterestGameNotificationBanner'
import EventManagerPanel from './EventManagerPanel'
import type { Database } from '@/lib/database.types'
import BrandMark from '@/components/BrandMark'

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
  onEventClick?: (event: Multi) => void
}

export default function FullPageLayout({
  user,
  language,
  events,
  eventsLoading,
  selectedGame,
  onGameChange,
  onLanguageChange,
  onLogout,
  onEventClick
}: FullPageLayoutProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [isEventManagerPanelOpen, setIsEventManagerPanelOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)


  // 모바일 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.mobile-menu-container')) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMobileMenuOpen])

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
      title: 'GPX hub',
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
      title: 'GPX hub',
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

  const chatChannels = [
    {
      path: '/events/regular/competizione/chat',
      label: { ko: '컴페티치오네', en: 'Competizione' },
      sub: { ko: 'Competizione 채팅', en: 'Competizione Chat' },
    },
    {
      path: '/events/regular/lemans/chat',
      label: { ko: '르망얼티밋', en: 'Le Mans Ultimate' },
      sub: { ko: 'Le Mans Ultimate 채팅', en: 'Le Mans Ultimate Chat' },
    },
    {
      path: '/events/regular/iracing/chat',
      label: { ko: '아이레이싱', en: 'iRacing' },
      sub: { ko: 'iRacing 채팅', en: 'iRacing Chat' },
    },
    {
      path: '/events/regular/assettocorsa/chat',
      label: { ko: '아세토코르사', en: 'Assetto Corsa' },
      sub: { ko: 'Assetto Corsa 채팅', en: 'Assetto Corsa Chat' },
    },
    {
      path: '/events/regular/gran-turismo7/chat',
      label: { ko: '그란투리스모7', en: 'Gran Turismo 7' },
      sub: { ko: 'Gran Turismo 7 채팅', en: 'Gran Turismo 7 Chat' },
    },
    {
      path: '/events/regular/automobilista2/chat',
      label: { ko: '오토모빌리스타2', en: 'Automobilista 2' },
      sub: { ko: 'Automobilista 2 채팅', en: 'Automobilista 2 Chat' },
    },
    {
      path: '/events/regular/f1-25/chat',
      label: { ko: 'F1 25', en: 'F1 25' },
      sub: { ko: 'F1 25 채팅', en: 'F1 25 Chat' },
    },
    {
      path: '/events/regular/ea-wrc/chat',
      label: { ko: 'EA WRC', en: 'EA WRC' },
      sub: { ko: 'EA WRC 채팅', en: 'EA WRC Chat' },
    },
  ] as const

  const managementLinks = [
    {
      type: 'regular',
      href: '/events/regular/new',
      label: { ko: '정기 갤멀 생성', en: 'Create Regular Event' },
      icon: '📅',
    },
    {
      type: 'flash',
      href: '/multis/new',
      label: { ko: '기습 갤멀 생성', en: 'Create Flash Event' },
      icon: '⚡',
    },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white overflow-x-hidden">
      {/* 상단 네비게이션 */}
      <TopNavigation
        user={user}
        language={language}
        onLanguageChange={onLanguageChange}
        onLogout={onLogout}
      />

      {/* 두번째 상단 네비게이션 (왼쪽 정렬 메뉴) */}
      <div className="fixed top-16 left-0 right-0 z-40 w-full bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center h-14">
            <div className="hidden md:flex items-center gap-10">
            {/* 채팅 채널 드롭다운 */}
            <div className="relative group">
              <button className="text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 py-2 border-b-2 border-transparent hover:border-cyan-500">
                {language === 'ko' ? '채팅 채널' : 'Chat Channels'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  {chatChannels.map(({ path, label, sub }) => (
                    <button
                      key={path}
                      onClick={() => window.open(path, '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                      className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <div className="font-medium">{label[language]}</div>
                      <div className="text-xs text-gray-400">{sub[language]}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 갤멀 관리 드롭다운 */}
            {user && (user.role === 'admin' || user.role === 'event_manager') && (
              <div className="relative group">
                <button className="text-gray-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 py-2 border-b-2 border-transparent hover:border-purple-500">
                  {language === 'ko' ? '갤멀 관리' : 'Manage Events'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 space-y-1">
                    {managementLinks.map((link) => (
                      <Link
                        key={link.type}
                        href={link.href}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {link.label[language]}
                      </Link>
                    ))}
                    <button
                      onClick={() => setIsEventManagerPanelOpen(true)}
                      className="block w-full text-left px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {language === 'ko' ? '투표 관리' : 'Manage Votes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 버튼 */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-900/80 rounded-lg backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 드롭다운 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-28 z-40 bg-gray-900 backdrop-blur-md md:hidden mobile-menu-container">
          <div className="h-full overflow-y-auto">
            {/* 사용자 정보 카드 - 큰 카드형 */}
            {user ? (
              <div className="p-6 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-b border-cyan-500/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">👤</div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-white mb-1">{user.nickname}</div>
                    <div className="text-sm text-cyan-400">환영합니다!</div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-4 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-lg font-semibold rounded-xl text-center shadow-lg hover:shadow-cyan-500/50 transition-all active:scale-95"
                >
                  프로필 보기 →
                </Link>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-b border-blue-500/20">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl text-center shadow-lg hover:shadow-purple-500/50 transition-all active:scale-95"
                >
                  🚀 시작하기 →
                </Link>
              </div>
            )}

            {/* 주요 메뉴 */}
            <div className="p-6 space-y-3">
              {/* 언어 전환 - 버튼 크기 증가 */}
              <div className="bg-gray-800/80 rounded-xl p-2 border border-gray-700 flex gap-2">
                <button
                  onClick={() => onLanguageChange('ko')}
                  className={`flex-1 py-4 text-base font-bold rounded-lg transition-all ${
                    language === 'ko' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 bg-gray-900/50'
                  }`}
                >
                  🇰🇷 한국어
                </button>
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`flex-1 py-4 text-base font-bold rounded-lg transition-all ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 bg-gray-900/50'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>

              {/* 로그아웃 버튼 */}
              {user && (
                <button
                  onClick={() => {
                    onLogout()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full py-4 px-6 bg-gray-800 text-red-400 text-lg font-semibold rounded-xl border border-red-500/30 hover:bg-red-900/20 transition-all active:scale-95"
                >
                  🚪 로그아웃
                </button>
              )}

              {/* 관리자 메뉴 구분선 */}
              {user && (user.role === 'admin' || user.role === 'event_manager') && (
                <>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                    <div className="text-sm text-gray-500 font-semibold">관리자</div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
                  </div>

                  {/* 관리자 메뉴 버튼들 - 더 큰 버튼 */}
                  {managementLinks.map(({ type, href, label, icon }) => (
                    <Link
                      key={type}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full py-5 px-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 text-white text-lg font-semibold rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all active:scale-95 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span>{label[language]}</span>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setIsEventManagerPanelOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full py-5 px-6 bg-gradient-to-r from-pink-900/40 to-purple-900/40 text-white text-lg font-semibold rounded-xl border border-pink-500/30 hover:border-pink-400/50 transition-all active:scale-95 text-left"
                  >
                    🎛️ 투표 관리
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 1: GPX 소개 섹션 */}
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative pt-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1920&q=60')] bg-cover bg-center opacity-[0.08]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526232761682-d26e04c95504?auto=format&fit=crop&w=1920&q=70')] bg-contain bg-right-bottom bg-no-repeat opacity-[0.07]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/90 to-black" />
        </div>
        <div className="max-w-7xl mx-auto text-center relative">
          {/* GPX 브랜딩 */}
          <div className="mb-12">
            <BrandMark size={120} textClassName="text-4xl" className="rounded-3xl mx-auto" />
            <div className="mt-3 text-sm text-gray-400">Grand Prix eXperience</div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-white">
            {language === 'ko' ? '더 쉽고 빠른 심레이싱' : 'Simplify your sim racing workflow'}
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            {language === 'ko'
              ? '복잡한 절차는 줄이고 레이스에만 집중하세요. GPX가 필요한 모든 정보를 연결합니다.'
              : 'Focus on driving while GPX connects schedules, servers, and data for you.'}
          </p>
          <div className="h-px w-80 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-12"></div>

          {/* 주요 기능 소개 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* 갤멀 일정 관리 */}
            <button 
              onClick={() => {
                const calendarSection = document.getElementById('calendar-section')
                if (calendarSection) {
                  calendarSection.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="relative group p-2"
            >
              <div className="absolute inset-2 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-cyan-500/40 rounded-2xl p-6 backdrop-blur-sm hover:border-cyan-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🗓️</div>
                <h3 className="text-xl font-bold mb-3 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">
                  {language === 'ko' ? '갤멀 일정 관리' : 'Gallery Schedule Management'}
                </h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '정기/기습 갤멀 일정을 캘린더로 관리' : 'Manage regular/flash gallery schedules with calendar'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-cyan-400 text-sm font-semibold">
                    {language === 'ko' ? '클릭하여 캘린더로 이동 →' : 'Go to calendar →'}
                  </div>
                </div>
              </div>
            </button>

            {/* 상시 서버 */}
            <Link href="/events/always-on" className="relative group p-2">
              <div className="absolute inset-2 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-green-500/40 rounded-2xl p-6 backdrop-blur-sm hover:border-green-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🌐</div>
                <h3 className="text-xl font-bold mb-3 text-green-400 group-hover:text-green-300 transition-colors duration-300">
                  {language === 'ko' ? '상시 서버' : 'Always-On Servers'}
                </h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '24시간 언제든 접속 가능한 상시 운영 서버' : '24/7 always-on server accessible anytime'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-green-400 text-sm font-semibold">
                    {language === 'ko' ? '클릭하여 입장 →' : 'Enter server →'}
                  </div>
                </div>
              </div>
            </Link>

            {/* 리그 운영 */}
            <Link href="/events/league" className="relative group p-2">
              <div className="absolute inset-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏆</div>
                <h3 className="text-xl font-bold mb-3 text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                  {language === 'ko' ? '리그 운영' : 'League Operations'}
                </h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '정식 리그 시스템으로 공식 레이싱 이벤트 운영' : 'Official racing events with formal league system'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-purple-400 text-sm font-semibold">
                    {language === 'ko' ? '클릭하여 입장 →' : 'Open league page →'}
                  </div>
                </div>
              </div>
            </Link>
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
          <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-center">
              <div className="text-2xl mb-2">⬇️</div>
              <p className="text-sm text-gray-400">{t[language].scrollHint}</p>
              <p className="text-xs text-gray-500 mt-1">{t[language].keyboardHint}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 캘린더 섹션 */}
      <section id="calendar-section" className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
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
              onEventClick={onEventClick}
            />
          )}
        </div>
      </section>

      {/* 이벤트 매니저 패널 */}
      {user && (user.role === 'admin' || user.role === 'event_manager') && (
        <EventManagerPanel
          isOpen={isEventManagerPanelOpen}
          onClose={() => setIsEventManagerPanelOpen(false)}
          userId={user.id}
        />
      )}

    </div>
  )
}

