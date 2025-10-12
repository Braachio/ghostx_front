'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import { MultiWithTemplate } from '@/types/events'

interface MeResponse {
  id: string
  nickname: string
}

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')
  const [views, setViews] = useState<number | null>(null)
  const [events, setEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()

  // 번역 텍스트
  const t = {
    ko: {
      welcome: (name: string) => `${name}님 환영합니다`,
      dashboard: '대시보드',
      logout: '로그아웃',
      signup: '회원가입',
      login: '로그인',
      title: 'GHOST-X',
      subtitle: '당신의 고스트카가 되어드립니다',
      description: '데이터 분석으로 랩타임을 단축시켜주는 디지털 고스트카',
      description2: '항상 당신보다 빠른 고스트처럼, 정확한 데이터로 당신의 한계를 뛰어넘어보세요',
      racingCommunity: '레이싱 커뮤니티',
      racingCommunityDesc: '다른 고스트카들과 경쟁하고\n레이싱 이벤트에 참여해보세요',
      ghostAnalysis: '고스트 분석',
      ghostAnalysisDesc: 'MoTeC 데이터로 당신만의 고스트카를 만들어\n랩타임 단축의 비밀을 찾아보세요',
      dashboardDesc: '나의 레이싱 성능을 분석하고\n개선 포인트를 확인해보세요',
      dashboardDescGuest: '로그인하고 나의 레이싱 성능을\n분석해보세요',
      clickToLogin: '클릭하여 로그인하기 →'
    },
    en: {
      welcome: (name: string) => `Welcome, ${name}`,
      dashboard: 'Dashboard',
      logout: 'Logout',
      signup: 'Sign Up',
      login: 'Login',
      title: 'GHOST-X',
      subtitle: 'Your Digital Ghost Car Awaits',
      description: 'AI-powered data analysis to reduce your lap times',
      description2: 'Like a ghost that\'s always faster than you, push your limits with precise data',
      racingCommunity: 'Racing Community',
      racingCommunityDesc: 'Compete with other ghost cars\nand join racing events',
      ghostAnalysis: 'Ghost Analysis',
      ghostAnalysisDesc: 'Create your own ghost car with MoTeC data\nand discover the secrets to faster lap times',
      dashboardDesc: 'Analyze your racing performance\nand identify improvement points',
      dashboardDescGuest: 'Login and analyze your\nracing performance',
      clickToLogin: 'Click to login →'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/multis')
      if (res.ok) {
        const data: MultiWithTemplate[] = await res.json()
        setEvents(data || [])
      }
    } catch (error) {
      console.error('이벤트 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadUserAndViews = async () => {
      try {
        await fetch('/api/incrementView', { method: 'POST' })

        const viewRes = await fetch('/api/getView')
        if (viewRes.ok) {
          const { view_count } = await viewRes.json()
          setViews(view_count)
        }

        const meRes = await fetch('/api/me')
        if (meRes.ok) {
          const { user } = await meRes.json()
          setUser(user)
        } else {
          setUser(null)
        }

        // 이벤트 데이터도 함께 로드
        await fetchEvents()
      } catch (err) {
        console.error('데이터 로드 실패:', err)
        setLoading(false)
      }
    }

    loadUserAndViews()
  }, [])

  // 이벤트 타입별로 분류하는 함수들
  const getEventsByType = (eventType: string) => {
    return events.filter(event => event.event_type === eventType).slice(0, 3) // 최대 3개만 표시
  }

  const eventTypeConfig = {
    regular_schedule: {
      title: '📅 정기 멀티',
      description: '매주 정해진 시간에 열리는 정기 멀티레이스',
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30 hover:border-blue-400'
    },
    always_on_server: {
      title: '🌐 상시 서버',
      description: '24시간 운영되는 상시 멀티레이스 서버',
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-500/30 hover:border-green-400'
    },
    league: {
      title: '🏆 리그 이벤트',
      description: '정식 리그 및 대회 이벤트',
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30 hover:border-purple-400'
    },
    flash_event: {
      title: '⚡ 기습갤멀',
      description: '갑작스럽게 열리는 일회성 이벤트',
      color: 'from-orange-500 to-red-500',
      borderColor: 'border-orange-500/30 hover:border-orange-400'
    }
  }

  return (
    <main className="min-h-screen bg-black text-white py-6 sm:py-8 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-cyan-300 rounded-full animate-pulse delay-300"></div>
        
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-16 gap-6 h-full">
            {Array.from({ length: 256 }).map((_, i) => (
              <div key={i} className="border border-gray-600"></div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10 relative z-10">

        {/* 헤더 - 브랜드 로고 & 로그인 상태 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-cyan-500">
          <div className="flex items-center space-x-2">
            <Image src="/logo/ghost-x-symbol.svg" alt="logo" width={32} height={32} className="dark:invert" />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{t[language].title}</h1>
          </div>

          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {/* 언어 전환 버튼 */}
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('ko')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    language === 'ko' 
                      ? 'bg-cyan-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-cyan-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  English
                </button>
              </div>

              {user ? (
                <>
                  <span className="text-sm text-green-400">
                    👤 {t[language].welcome(user.nickname)}
                  </span>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-3 py-1.5 text-sm rounded-md border border-cyan-500 text-white bg-gray-800 hover:bg-cyan-900 hover:border-cyan-400 transition text-center"
                  >
                    📈 {t[language].dashboard}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full sm:w-auto px-3 py-1.5 text-sm rounded-md border border-red-500 text-red-400 bg-gray-800 hover:bg-red-900 hover:border-red-400 transition"
                  >
                    {t[language].logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-cyan-500 text-sm text-white bg-gray-800 hover:bg-cyan-900 hover:border-cyan-400 transition text-center"
                  >
                    {t[language].signup}
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm hover:from-cyan-700 hover:to-blue-700 transition text-center shadow-lg shadow-cyan-500/25"
                  >
                    {t[language].login}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {t[language].title}
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
            {language === 'ko' ? (
              <>당신의 <span className="text-cyan-400">고스트카</span>가 되어드립니다</>
            ) : (
              <>Your <span className="text-cyan-400">Ghost Car</span> Awaits</>
            )}
          </h2>
          <p className="text-xl text-gray-300 mb-2">
            {language === 'ko' ? (
              <>👻 데이터 분석으로 랩타임을 단축시켜주는 <span className="text-cyan-400 font-semibold">디지털 고스트카</span></>
            ) : (
              <>👻 <span className="text-cyan-400 font-semibold">Digital Ghost Car</span> powered by data analysis to reduce lap times</>
            )}
          </p>
          <p className="text-lg text-gray-400 mb-8">
            {t[language].description2}
          </p>
        </div>

        {/* 메뉴 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Steam 프로필 카드 (로그인 시) */}
          {user ? (
            <Link href="/profile">
              <div className="group p-6 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
                <div className="text-center">
                  <div className="text-5xl mb-3">🎮</div>
                  <h2 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">
                    Steam 프로필
                  </h2>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    레이싱 게임 통계와<br />업적 현황
                  </p>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/login">
              <div className="group p-6 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
                <div className="text-center">
                  <div className="text-5xl mb-3">🎮</div>
                  <h2 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">
                    Steam 프로필
                  </h2>
                  <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Steam 로그인하고<br />통계 확인
                  </p>
                  <div className="mt-2 text-xs text-purple-400 group-hover:text-purple-300 transition-colors">
                    로그인 필요
                  </div>
                </div>
              </div>
            </Link>
          )}

          <Link href="/events">
            <div className="group p-6 rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
              <div className="text-center">
                <div className="text-5xl mb-3">🗓️</div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  {t[language].racingCommunity}
                </h2>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {t[language].racingCommunityDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/multis">
            <div className="group p-6 rounded-xl border-2 border-orange-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
              <div className="text-center">
                <div className="text-5xl mb-3">⚡</div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-orange-400 transition-colors">
                  기습 갤멀
                </h2>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  예고 없이 갑작스럽게<br />열리는 일회성 이벤트
                </p>
              </div>
            </div>
          </Link>

          <Link href="/upload-id">
            <div className="group p-6 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Image src="/logo/Logo-acc.png" alt="ACC-Logo" width={40} height={40} />
                  <div className="text-5xl">📊</div>
                </div>
                <h2 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                  {t[language].ghostAnalysis}
                </h2>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {t[language].ghostAnalysisDesc}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* 이벤트 섹션 */}
        {!loading && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                🏁 레이싱 이벤트
              </h2>
              <p className="text-gray-400">다양한 멀티레이스 이벤트에 참여해보세요</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 정기 멀티 */}
              {getEventsByType('regular_schedule').length > 0 && (
                <div className={`p-6 rounded-xl border-2 ${eventTypeConfig.regular_schedule.borderColor} bg-gradient-to-br from-gray-900 to-black`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{eventTypeConfig.regular_schedule.title}</h3>
                    <div className="text-sm text-blue-400">
                      게임별 보기 →
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{eventTypeConfig.regular_schedule.description}</p>
                  
                  {/* 게임별 버튼들 */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Link href="/events/regular/iracing" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      아이레이싱
                    </Link>
                    <Link href="/events/regular/assettocorsa" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      아세토코르사
                    </Link>
                    <Link href="/events/regular/gran-turismo7" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      그란투리스모7
                    </Link>
                    <Link href="/events/regular/automobilista2" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      오토모빌리스타2
                    </Link>
                    <Link href="/events/regular/competizione" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      컴페티치오네
                    </Link>
                    <Link href="/events/regular/lemans" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      르망얼티밋
                    </Link>
                    <Link href="/events/regular/f1-25" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      F1 25
                    </Link>
                    <Link href="/events/regular/ea-wrc" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-colors">
                      EA WRC
                    </Link>
                  </div>
                  
                  <div className="space-y-3">
                    {getEventsByType('regular_schedule').map((event) => (
                      <Link key={event.id} href={`/multis/${event.id}`}>
                        <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="font-medium text-white">{event.title}</div>
                          <div className="text-sm text-gray-400">
                            {event.game} | {event.multi_day?.join(', ')} {event.multi_time}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 상시 서버 */}
              {getEventsByType('always_on_server').length > 0 && (
                <div className={`p-6 rounded-xl border-2 ${eventTypeConfig.always_on_server.borderColor} bg-gradient-to-br from-gray-900 to-black`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{eventTypeConfig.always_on_server.title}</h3>
                    <Link href="/events/always-on" className="text-sm text-green-400 hover:text-green-300">
                      전체보기 →
                    </Link>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{eventTypeConfig.always_on_server.description}</p>
                  <div className="space-y-3">
                    {getEventsByType('always_on_server').map((event) => (
                      <Link key={event.id} href={`/multis/${event.id}`}>
                        <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="font-medium text-white">{event.title}</div>
                          <div className="text-sm text-gray-400">
                            {event.game} | {event.game_track}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 리그 이벤트 */}
              {getEventsByType('league').length > 0 && (
                <div className={`p-6 rounded-xl border-2 ${eventTypeConfig.league.borderColor} bg-gradient-to-br from-gray-900 to-black`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{eventTypeConfig.league.title}</h3>
                    <Link href="/events/league" className="text-sm text-purple-400 hover:text-purple-300">
                      전체보기 →
                    </Link>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{eventTypeConfig.league.description}</p>
                  <div className="space-y-3">
                    {getEventsByType('league').map((event) => (
                      <Link key={event.id} href={`/multis/${event.id}`}>
                        <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="font-medium text-white">{event.title}</div>
                          <div className="text-sm text-gray-400">
                            {event.game} | {event.multi_day?.join(', ')} {event.multi_time}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 기습갤멀 */}
              {getEventsByType('flash_event').length > 0 && (
                <div className={`p-6 rounded-xl border-2 ${eventTypeConfig.flash_event.borderColor} bg-gradient-to-br from-gray-900 to-black`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{eventTypeConfig.flash_event.title}</h3>
                    <Link href="/multis" className="text-sm text-orange-400 hover:text-orange-300">
                      전체보기 →
                    </Link>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{eventTypeConfig.flash_event.description}</p>
                  <div className="space-y-3">
                    {getEventsByType('flash_event').map((event) => (
                      <Link key={event.id} href={`/multis/${event.id}`}>
                        <div className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                          <div className="font-medium text-white">{event.title}</div>
                          <div className="text-sm text-gray-400">
                            {event.game} | {event.multi_day?.join(', ')} {event.multi_time}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 모든 이벤트 보기 버튼 */}
            <div className="text-center">
              <Link href="/multis">
                <button className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 font-semibold">
                  🏁 모든 이벤트 보기
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* About Section */}
        {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">📘 서비스 소개</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            본 웹서비스는 심레이싱 유저들을 위한 데이터 분석 도구입니다.
            <br />
            주행 데이터를 업로드하면, <strong>자동으로 분석</strong>되어 주행 습관, 브레이킹 포인트, 코너링 스타일 등을 시각화된 리포트로 확인할 수 있습니다.
            <br />
            이를 통해 <span className="text-blue-600 dark:text-blue-400 font-semibold">자신의 실력 향상</span>은 물론, <span className="text-blue-600 dark:text-blue-400 font-semibold">커뮤니티에서의 경쟁력</span>도 키울 수 있습니다.
          </p>
        </div> */}

        {/* FAQ Section */}
        {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">❓ 자주 묻는 질문 (FAQ)</h2>
          <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <p className="font-semibold">Q. 어떤 게임에서 추출한 데이터를 지원하나요?</p>
              <p>A. 현재는 MoTeC에서 내보낸 CSV 포맷만 지원하며, 아세토코르사 컴페티치오네(MoTeC 연동 가능 게임)에 호환됩니다.</p>
            </li>
            <li>
              <p className="font-semibold">Q. 데이터를 업로드하면 어디에 저장되나요?</p>
              <p>A. 분석 결과는 사용자 고유 ID와 함께 Supabase에 안전하게 저장됩니다.</p>
            </li>
            <li>
              <p className="font-semibold">Q. 분석 결과는 어떻게 활용하나요?</p>
              <p>A. 분석 리포트를 통해 개인 훈련 계획을 세우거나, 리그/대회 준비에 참고할 수 있습니다.</p>
            </li>
          </ul>
        </div> */}

        {/* Feedback Form Section */}
        <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/10">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              👻 고스트와의 소통
            </h2>
            <p className="text-gray-300">
              더 빠른 고스트카가 되기 위한 피드백이나 궁금한 점을 남겨주세요.
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const email = form.email.value
              const message = form.message.value

              const res = await fetch('/api/submitFeedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, message }),
              })

              if (res.ok) {
                alert('✅ 피드백이 전송되었습니다. 감사합니다!')
                form.reset()
              } else {
                alert('❌ 전송 실패. 다시 시도해주세요.')
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              name="email"
              placeholder="이메일 (선택)"
              className="w-full px-4 py-3 border-2 border-purple-500/30 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            />
            <textarea
              name="message"
              required
              placeholder="고스트카 개선을 위한 의견이나 궁금한 점을 입력해주세요"
              rows={4}
              className="w-full px-4 py-3 border-2 border-purple-500/30 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 font-semibold"
            >
              보내기
            </button>
          </form>
        </div>
        {/* 방문 수 */}
        <div className="text-center text-sm text-gray-400 border-t border-gray-800 pt-6">
          <span className="inline-flex items-center gap-2">
            👻 고스트카를 찾은 레이서: 
            <span className="text-cyan-400 font-bold">
              {views !== null ? views.toLocaleString() : '...'}명
            </span>
          </span>
        </div>  

      </div>

      <Footer />
      {/* 쿠키 설정 */}
      <CookieConsentBanner />      
    </main>
  )
}

