'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import GameInterestModal from '@/components/GameInterestModal'
import EventCalendar from '@/components/EventCalendar'
import type { Database } from '@/lib/database.types'

interface MeResponse {
  id: string
  nickname: string
}

type Multi = Database['public']['Tables']['multis']['Row']

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')
  const [views, setViews] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showGameInterestModal, setShowGameInterestModal] = useState(false)
  const [hasCheckedGameInterest, setHasCheckedGameInterest] = useState(false)
  const [events, setEvents] = useState<Multi[]>([])
  const [selectedGame, setSelectedGame] = useState('all')
  const [eventsLoading, setEventsLoading] = useState(true)
  const supabase = useSupabaseClient()

  // 번역 텍스트
  const t = {
    ko: {
      welcome: (name: string) => `${name}님 환영합니다`,
      dashboard: '대시보드',
      logout: '로그아웃',
      getStarted: '시작하기',
      title: 'GHOST-X',
      subtitle: '당신의 고스트카가 되어드립니다',
      // description: '데이터 분석으로 랩타임을 단축시켜주는 디지털 고스트카',
      // description2: '항상 당신보다 빠른 고스트처럼, 정확한 데이터로 당신의 한계를 뛰어넘어보세요',
      racingCommunity: '갤멀 일정 관리',
      racingCommunityDesc: '정기 멀티 일정을 통합 관리하고\n투표로 트랙을 선택해보세요',
      ghostAnalysis: '고스트 분석',
      ghostAnalysisDesc: 'MoTeC 데이터로 당신만의 고스트카를 만들어\n랩타임 단축의 비밀을 찾아보세요',
      dashboardDesc: '나의 레이싱 성능을 분석하고\n개선 포인트를 확인해보세요',
      dashboardDescGuest: '로그인하고 나의 레이싱 성능을\n분석해보세요',
      clickToLogin: '시작하기 →'
    },
    en: {
      welcome: (name: string) => `Welcome, ${name}`,
      dashboard: 'Dashboard',
      logout: 'Logout',
      getStarted: 'Get Started',
      title: 'GHOST-X',
      subtitle: 'Your Digital Ghost Car Awaits',
      description: 'AI-powered data analysis to reduce your lap times',
      description2: 'Like a ghost that\'s always faster than you, push your limits with precise data',
      racingCommunity: 'Multi Schedule Management',
      racingCommunityDesc: 'Manage regular multi schedules\nand vote for track selection',
      ghostAnalysis: 'Ghost Analysis',
      ghostAnalysisDesc: 'Create your own ghost car with MoTeC data\nand discover the secrets to faster lap times',
      dashboardDesc: 'Analyze your racing performance\nand identify improvement points',
      dashboardDescGuest: 'Login and analyze your\nracing performance',
      clickToLogin: 'Get Started →'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }


  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

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
          
          // 스팀 로그인 사용자이고 관심게임 설정을 확인하지 않은 경우
          if (user && user.id && !hasCheckedGameInterest) {
            // 관심게임 설정 여부 확인
            const interestRes = await fetch('/api/user-interest-games')
            if (interestRes.ok) {
              const { games } = await interestRes.json()
              if (!games || games.length === 0) {
                // 관심게임이 설정되지 않은 경우 모달 표시
                setShowGameInterestModal(true)
              }
            }
            setHasCheckedGameInterest(true)
          }
        } else {
          setUser(null)
        }

        // 이벤트 데이터 가져오기
        const eventsRes = await fetch('/api/multis')
        if (eventsRes.ok) {
          const { data } = await eventsRes.json()
          setEvents(data || [])
        }
        setEventsLoading(false)

      } catch (err) {
        console.error('데이터 로드 실패:', err)
      }
    }

    loadUserAndViews()
  }, [mounted, hasCheckedGameInterest])

  const handleGameInterestComplete = () => {
    setShowGameInterestModal(false)
  }

  const handleGameInterestClose = () => {
    setShowGameInterestModal(false)
  }

  const handleGameChange = (game: string) => {
    setSelectedGame(game)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10">

        {/* 헤더 - 네비게이션 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 pt-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo/ghost-x-symbol.svg" alt="logo" width={40} height={40} className="dark:invert" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                {t[language].title}
              </h1>
            </Link>
            {mounted && views !== null && (
              <span className="text-gray-500 text-xs bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
                👁️ {views.toLocaleString()}
              </span>
            )}
          </div>

          <div className="w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              {/* 갤멀 일정 메뉴 */}
              <div className="flex bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
                <Link
                  href="/events"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  🗓️ 갤멀 일정
                </Link>
                <Link
                  href="/events/regular"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  📅 정기 갤멀
                </Link>
                <Link
                  href="/multis"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  ⚡ 기습 갤멀
                </Link>
              </div>

              {/* 언어 전환 버튼 */}
              <div className="flex bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 border border-gray-700">
                <button
                  onClick={() => setLanguage('ko')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    language === 'ko' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇰🇷 한국어
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    language === 'en' 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🇺🇸 English
                </button>
              </div>

              {user ? (
                <>
                  <Link
                    href="/events/regular/new"
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm hover:from-green-700 hover:to-emerald-700 transition shadow-lg shadow-green-500/30"
                  >
                    ➕ 갤멀 생성
                  </Link>
                  <span className="text-sm bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700 text-cyan-400">
                    👤 {t[language].welcome(user.nickname)}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white text-sm hover:from-red-700 hover:to-red-800 transition shadow-lg shadow-red-500/30"
                  >
                    {t[language].logout}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm hover:from-cyan-700 hover:to-blue-700 transition shadow-lg shadow-cyan-500/50"
                  >
                    {t[language].getStarted}
                  </Link>
                  {process.env.NODE_ENV !== 'production' && (
                    <>
                      <Link
                        href="/admin-login"
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white text-sm hover:from-red-700 hover:to-orange-700 transition shadow-lg shadow-red-500/50"
                      >
                        관리자 로그인
                      </Link>
                      <Link
                        href="/debug-user"
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm hover:from-purple-700 hover:to-pink-700 transition shadow-lg shadow-purple-500/50"
                      >
                        사용자 ID 확인
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* 메인 타이틀 - 갤멀 일정 중심 */}
        <div className="text-center py-12 mb-8">
          <div className="inline-block mb-8">
            <div className="text-8xl animate-pulse">👻</div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {t[language].title}
            </span>
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            {language === 'ko' ? (
              <>갤멀 일정을 한눈에 확인하고<br />참여할 멀티를 선택하세요</>
            ) : (
              <>Check Gallery Multi Schedules<br />and Choose Your Events</>
            )}
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            {language === 'ko' ? (
              <>정기 갤멀부터 기습 갤멀까지, 모든 레이싱 이벤트를 캘린더로 관리하세요</>
            ) : (
              <>Manage all racing events from regular to flash events with our calendar system</>
            )}
          </p>
          <div className="h-px w-96 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>

        {/* 갤멀 일정 캘린더 */}
        <div className="max-w-7xl mx-auto mb-12">
          {eventsLoading ? (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">이벤트를 불러오는 중...</p>
            </div>
          ) : (
            <EventCalendar
              events={events}
              selectedGame={selectedGame}
              onGameChange={handleGameChange}
            />
          )}
        </div>

        {/* 갤멀 관련 액션 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {/* 정기 갤멀 */}
          <Link href="/events/regular" className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-blue-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-center">
                <div className="text-6xl mb-4">📅</div>
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  정기 갤멀
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  매주 반복되는<br />정기 레이싱 이벤트
                </p>
              </div>
            </div>
          </Link>

          {/* 기습 갤멀 */}
          <Link href="/multis" className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-orange-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-orange-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  기습 갤멀
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  예고 없이 갑작스럽게<br />열리는 일회성 이벤트
                </p>
              </div>
            </div>
          </Link>

          {/* Steam 프로필 */}
          {user ? (
            <Link href="/profile" className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Steam 프로필
                  </h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    레이싱 게임 통계와<br />업적 현황
                  </p>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Steam 프로필
                  </h2>
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    Steam 로그인하고<br />통계 확인
                  </p>
                  <div className="inline-block px-3 py-1 bg-purple-900/30 rounded-full border border-purple-500/30">
                    <span className="text-purple-300 text-xs font-semibold">로그인 필요</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* 기습 갤멀, 대시보드 & 고스트 분석 - 임시 비활성화 */}
          {/* 
          <Link href="/dashboard">
            <div className="group p-8 rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
              <div className="text-center">
                <div className="text-6xl mb-4">📈</div>
                <h2 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">
                  {t[language].dashboard}
                </h2>
                <p className="text-gray-300 group-hover:text-white transition-colors">
                  {t[language].dashboardDesc}
                </p>
              </div>
            </div>
          </Link>

          <Link href="/upload-id">
            <div className="group p-8 rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-gray-900 to-black hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Image src="/logo/Logo-acc.png" alt="ACC-Logo" width={48} height={48} />
                  <div className="text-6xl">📊</div>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">
                  {t[language].ghostAnalysis}
                </h2>
                <p className="text-gray-300 group-hover:text-white transition-colors">
                  {t[language].ghostAnalysisDesc}
                </p>
              </div>
            </div>
          </Link>
          */}
        </div>


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
              {mounted && views !== null ? views.toLocaleString() : '...'}명
            </span>
          </span>
        </div>  

      </div>

      <Footer />
      {/* 쿠키 설정 */}
      <CookieConsentBanner />
      
      {/* 관심게임 설정 모달 */}
      <GameInterestModal
        isOpen={showGameInterestModal}
        onClose={handleGameInterestClose}
        onComplete={handleGameInterestComplete}
      />
    </main>
  )
}

