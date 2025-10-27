'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import MobileEventCalendar from './MobileEventCalendar'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

interface MobileLayoutProps {
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

export default function MobileLayout({
  user,
  language,
  events,
  eventsLoading,
  selectedGame,
  onGameChange,
  onLanguageChange,
  onLogout,
  onEventClick
}: MobileLayoutProps) {
  const [currentSection, setCurrentSection] = useState(0)
  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar')

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
      {/* 모바일 상단 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <Link href="/mobile" className="flex items-center gap-2">
              <Image 
                src="/logo/ghost-x-symbol.svg" 
                alt="Ghost-X" 
                width={24} 
                height={24} 
                className="dark:invert" 
              />
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {t[language].title}
              </span>
            </Link>

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-cyan-400">
                    👤 {user.nickname}
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-white text-sm font-medium hover:text-red-400 transition-colors px-2 py-1"
                  >
                    {t[language].logout}
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-white text-sm font-medium hover:text-cyan-400 transition-colors px-2 py-1"
                >
                  {t[language].getStarted}
                </Link>
              )}

              {/* 언어 전환 */}
              <div className="flex bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
                <button
                  onClick={() => onLanguageChange('ko')}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
                    language === 'ko' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇰🇷
                </button>
                <button
                  onClick={() => onLanguageChange('en')}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${
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
      </nav>

      {/* Section 1: Ghost-X 소개 섹션 */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20 relative pt-20">
        <div className="max-w-md mx-auto text-center">
          {/* Ghost-X 브랜딩 */}
          <div className="mb-12">
            <div className="inline-block mb-6">
              <div className="text-6xl animate-pulse">👻</div>
            </div>
            <h1 className="text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {t[language].title}
              </span>
            </h1>
            <h2 className="text-lg font-bold mb-6 text-white">
              {language === 'ko' ? (
                <>심레이싱 게임 갤러리 멀티 일정 통합 관리 시스템</>
              ) : (
                <>Sim Racing Gallery Multi Schedule Management System</>
              )}
            </h2>
            <p className="text-base text-gray-400 mb-8 leading-relaxed">
              {language === 'ko' ? (
                <>정기 갤멀부터 기습 갤멀, 리그 운영, 상시 서버까지<br />모든 레이싱 이벤트를 한 곳에서 효율적으로 관리하세요</>
              ) : (
                <>From regular gallery multis to flash events, league operations, and always-on servers<br />Manage all racing events efficiently in one place</>
              )}
            </p>
            <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-6"></div>
          </div>

          {/* 주요 기능 소개 */}
          <div className="grid grid-cols-1 gap-4 mb-12">
            {/* 갤멀 일정 관리 */}
            <button 
              onClick={() => setCurrentSection(1)}
              className="relative group p-2"
            >
              <div className="absolute inset-2 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-cyan-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-cyan-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🗓️</div>
                <h3 className="text-lg font-bold mb-2 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300">갤멀 일정 관리</h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '정기/기습 갤멀 일정을 캘린더로 관리' : 'Manage regular/flash gallery schedules with calendar'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-cyan-400 text-sm font-semibold">
                    클릭하여 캘린더로 이동 →
                  </div>
                </div>
              </div>
            </button>

            {/* 상시 서버 */}
            <Link href="/events/always-on" className="relative group p-2">
              <div className="absolute inset-2 bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-green-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-green-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🌐</div>
                <h3 className="text-lg font-bold mb-2 text-green-400 group-hover:text-green-300 transition-colors duration-300">상시 서버</h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '24시간 언제든 접속 가능한 상시 운영 서버' : '24/7 always-on server accessible anytime'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-green-400 text-sm font-semibold">
                    클릭하여 입장 →
                  </div>
                </div>
              </div>
            </Link>

            {/* 리그 운영 */}
            <Link href="/events/league" className="relative group p-2">
              <div className="absolute inset-2 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-4 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🏆</div>
                <h3 className="text-lg font-bold mb-2 text-purple-400 group-hover:text-purple-300 transition-colors duration-300">리그 운영</h3>
                <p className="text-gray-300 text-sm group-hover:text-gray-200 transition-colors duration-300">
                  {language === 'ko' ? '정식 리그 시스템으로 공식 레이싱 이벤트 운영' : 'Official racing events with formal league system'}
                </p>
                
                {/* 호버 효과 */}
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-purple-400 text-sm font-semibold">
                    클릭하여 입장 →
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* 로그인하지 않은 사용자를 위한 시작하기 버튼 */}
          {!user && (
            <div className="text-center mb-12">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white text-base font-bold rounded-xl hover:from-cyan-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
              >
                <span className="text-xl">🚀</span>
                <span>{t[language].getStarted}</span>
                <span className="text-lg">→</span>
              </Link>
              <p className="text-gray-400 text-sm mt-3">
                {language === 'ko' ? '지금 바로 시작하여 모든 갤멀 일정을 확인하세요!' : 'Start now to check all gallery multi schedules!'}
              </p>
            </div>
          )}

          {/* 스크롤 힌트 */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="text-center">
              <div className="text-xl mb-1">⬇️</div>
              <p className="text-xs text-gray-400">{t[language].scrollHint}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: 캘린더 섹션 */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              🗓️ {t[language].gallerySchedule}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {language === 'ko' ? '모든 갤멀 일정을 한눈에 확인하세요' : 'View all gallery multi schedules at a glance'}
            </p>
          </div>
          
          {eventsLoading ? (
            <div className="bg-gray-900 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">이벤트를 불러오는 중...</p>
            </div>
          ) : (
            <MobileEventCalendar
              events={events}
              selectedGame={selectedGame}
              onGameChange={onGameChange}
              onEventClick={onEventClick}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}
        </div>
      </section>
    </div>
  )
}
