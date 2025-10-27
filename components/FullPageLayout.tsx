'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import EventCalendar from './EventCalendar'
import InterestGameNotificationBanner from './InterestGameNotificationBanner'
import EventManagerPanel from './EventManagerPanel'
import FeedbackForm from './FeedbackForm'
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
  const [isScrolled, setIsScrolled] = useState(false)
  const [isEventManagerPanelOpen, setIsEventManagerPanelOpen] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

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
             {/* 상단 네비게이션 - 두 줄 구조 */}
       <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
         {/* 1번째 줄 - 스크롤 시 숨김 (로고, 프로필, 로그아웃, 언어변경) */}
         <div className={`w-full px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
           isScrolled 
             ? 'opacity-0 invisible h-0 overflow-hidden' 
             : 'opacity-100 visible h-12'
         }`}>
           <div className="flex items-center justify-between h-12">
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

             {/* 프로필 & 언어 */}
             <div className="hidden md:flex items-center gap-6">
               {user ? (
                 <>
                   <span className="text-sm text-cyan-400">
                     👤 {t[language].welcome(user.nickname)}
                   </span>
                   <button
                     onClick={onLogout}
                     className="text-white text-sm font-medium hover:text-red-400 transition-colors"
                   >
                     {t[language].logout}
                   </button>
                 </>
               ) : (
                 <Link
                   href="/login"
                   className="text-white text-sm font-medium hover:text-cyan-400 transition-colors"
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
         </div>

                   {/* 2번째 줄 - 스크롤 시 고정 표시 (가운데 정렬) */}
          <div className={`w-full px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
            isScrolled 
              ? 'bg-black/95 backdrop-blur-md border-b border-gray-800' 
              : 'bg-transparent'
          }`}>
            <div className="flex items-center justify-center h-16">
              {/* 중앙 정렬된 메뉴 */}
              <div className="hidden md:flex items-center gap-8">
                {/* 채팅 채널 드롭다운 */}
                <div className="relative group">
                  <button className="text-white text-sm font-medium hover:text-cyan-400 transition-colors flex items-center gap-2">
                    💬 채팅 채널
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* 드롭다운 메뉴 */}
                  <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <button 
                        onClick={() => window.open('/events/regular/competizione/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏁</span>
                        <div>
                          <div className="font-medium">컴페티치오네</div>
                          <div className="text-xs text-gray-400">Competizione 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/lemans/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏎️</span>
                        <div>
                          <div className="font-medium">르망얼티밋</div>
                          <div className="text-xs text-gray-400">Le Mans Ultimate 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/iracing/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏆</span>
                        <div>
                          <div className="font-medium">아이레이싱</div>
                          <div className="text-xs text-gray-400">iRacing 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/assettocorsa/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏎️</span>
                        <div>
                          <div className="font-medium">아세토코르사</div>
                          <div className="text-xs text-gray-400">Assetto Corsa 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/gran-turismo7/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏁</span>
                        <div>
                          <div className="font-medium">그란투리스모7</div>
                          <div className="text-xs text-gray-400">Gran Turismo 7 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/automobilista2/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏎️</span>
                        <div>
                          <div className="font-medium">오토모빌리스타2</div>
                          <div className="text-xs text-gray-400">Automobilista 2 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/f1-25/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏁</span>
                        <div>
                          <div className="font-medium">F1 25</div>
                          <div className="text-xs text-gray-400">F1 25 채팅</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => window.open('/events/regular/ea-wrc/chat', '_blank', 'width=600,height=900,scrollbars=yes,resizable=yes')}
                        className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏎️</span>
                        <div>
                          <div className="font-medium">EA WRC</div>
                          <div className="text-xs text-gray-400">EA WRC 채팅</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 갤멀 관리 드롭다운 */}
                {user && (user.role === 'admin' || user.role === 'event_manager') && (
                  <div className="relative group">
                    <button className="text-white text-sm font-medium hover:text-purple-400 transition-colors flex items-center gap-2">
                      🎛️ 갤멀 관리
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* 드롭다운 메뉴 */}
                    <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        <Link
                          href="/events/regular/new"
                          className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <span className="text-lg">📅</span>
                          <div>
                            <div className="font-medium">정기 갤멀 생성</div>
                            <div className="text-xs text-gray-400">Regular Event</div>
                          </div>
                        </Link>
                        <Link
                          href="/multis/new"
                          className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <span className="text-lg">⚡</span>
                          <div>
                            <div className="font-medium">기습 갤멀 생성</div>
                            <div className="text-xs text-gray-400">Flash Event</div>
                          </div>
                        </Link>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <button
                          onClick={() => setIsEventManagerPanelOpen(true)}
                          className="block w-full px-4 py-3 text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                        >
                          <span className="text-lg">🎛️</span>
                          <div>
                            <div className="font-medium">ON/OFF 및 투표 관리</div>
                            <div className="text-xs text-gray-400">Manage Events</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative pt-28">
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
                <h3 className="text-xl font-bold mb-3 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">갤멀 일정 관리</h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '정기/기습 갤멀 일정을 캘린더로 관리' : 'Manage regular/flash gallery schedules with calendar'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-cyan-400 text-sm font-semibold">
                    클릭하여 캘린더로 이동 →
                  </div>
                </div>
              </div>
            </button>

            {/* 상시 서버 */}
            <Link href="/events/always-on" className="relative group p-2">
              <div className="absolute inset-2 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-green-500/40 rounded-2xl p-6 backdrop-blur-sm hover:border-green-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🌐</div>
                <h3 className="text-xl font-bold mb-3 text-green-400 group-hover:text-green-300 transition-colors duration-300">상시 서버</h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '24시간 언제든 접속 가능한 상시 운영 서버' : '24/7 always-on server accessible anytime'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-green-400 text-sm font-semibold">
                    클릭하여 입장 →
                  </div>
                </div>
              </div>
            </Link>

            {/* 리그 운영 */}
            <Link href="/events/league" className="relative group p-2">
              <div className="absolute inset-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-6 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏆</div>
                <h3 className="text-xl font-bold mb-3 text-purple-400 group-hover:text-purple-300 transition-colors duration-300">리그 운영</h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '정식 리그 시스템으로 공식 레이싱 이벤트 운영' : 'Official racing events with formal league system'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-purple-400 text-sm font-semibold">
                    클릭하여 입장 →
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

      {/* Section 3: 피드백 섹션 */}
      <section className="fullpage-section min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              💬 피드백 보내기
            </h2>
            <p className="text-lg text-gray-400">
              {language === 'ko' ? '서비스 개선을 위한 소중한 의견을 들려주세요' : 'Share your valuable feedback for service improvement'}
            </p>
          </div>

          <div className="flex justify-center">
            {/* 피드백 카드 - 가운데 배치 */}
            <button 
              onClick={() => setShowFeedbackModal(true)}
              className="group w-full"
            >
              <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105">
                <div className="text-center">
                  <div className="text-6xl mb-6">💬</div>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    피드백 보내기
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {language === 'ko' ? '서비스 개선을 위한 소중한 의견을 들려주세요' : 'Share your valuable feedback for service improvement'}
                  </p>
                  <div className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    피드백 보내기 →
                  </div>
                </div>
              </div>
            </button>

          </div>
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

      {/* 피드백 모달 */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <FeedbackForm onClose={() => setShowFeedbackModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

