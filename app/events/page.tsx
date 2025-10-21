'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function EventsPage() {
  const [language] = useState<'ko' | 'en'>('ko')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* 상단 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-2xl">👻</span>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Ghost-X
              </span>
            </Link>
            
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              ← 메인으로
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-20">
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
                    <span className="relative z-10">🏎️ 아이레이싱</span>
                  </Link>
                  <Link 
                    href="/events/regular/assettocorsa" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10">🏎️ 아세토코르사</span>
                  </Link>
                  <Link 
                    href="/events/regular/gran-turismo7" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10">🏎️ 그란투리스모7</span>
                  </Link>
                  <Link 
                    href="/events/regular/competizione" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10">🏎️ 컴페티치오네</span>
                  </Link>
                  <Link 
                    href="/events/regular/lemans" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10">🏎️ 르망얼티밋</span>
                  </Link>
                  <Link 
                    href="/events/regular/f1-25" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10">🏎️ F1 25</span>
                  </Link>
                  <Link 
                    href="/events/regular/automobilista2" 
                    className="relative group/btn overflow-hidden px-6 py-3 bg-blue-900/20 hover:bg-blue-900/40 rounded-lg text-center text-sm text-blue-300 hover:text-blue-200 transition-all border border-blue-500/20 hover:border-blue-400/40 hover:scale-105"
                  >
                    <span className="relative z-10">🏎️ 오토모빌리스타2</span>
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
      </div>
    </div>
  )
}
