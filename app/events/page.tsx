'use client'

import Link from 'next/link'

export default function EventsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🏁 레이싱 이벤트</h1>
        <p className="text-gray-400">
          다양한 레이싱 이벤트를 선택하세요
        </p>
      </div>

      {/* 이벤트 타입 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 정기 멀티 */}
        <div className="group">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25">
            <div className="text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-blue-400 mb-2">정기 멀티</h3>
              <p className="text-gray-300 text-sm mb-4">
                매주 정해진 시간에 열리는<br />정규 레이싱 이벤트
              </p>
              <div className="text-blue-300 text-sm font-semibold mb-4">
                게임별 전용 페이지
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/events/regular/iracing" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  아이레이싱
                </Link>
                <Link href="/events/regular/assettocorsa" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  아세토코르사
                </Link>
                <Link href="/events/regular/gran-turismo7" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  그란투리스모7
                </Link>
                <Link href="/events/regular/competizione" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  컴페티치오네
                </Link>
                <Link href="/events/regular/lemans" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  르망얼티밋
                </Link>
                <Link href="/events/regular/f1-25" className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg text-center text-xs text-blue-300 hover:text-blue-200 transition-colors">
                  F1 25
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 상시 서버 */}
        <Link href="/events/always-on" className="group">
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-6 hover:border-green-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25">
            <div className="text-center">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">상시 서버</h3>
              <p className="text-gray-300 text-sm mb-4">
                24시간 언제든 접속 가능한<br />상시 운영 서버
              </p>
              <div className="text-green-300 text-sm font-semibold">
                모든 게임 통합 페이지
              </div>
            </div>
          </div>
        </Link>

        {/* 리그 */}
        <Link href="/events/league" className="group">
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-purple-400 mb-2">리그</h3>
              <p className="text-gray-300 text-sm mb-4">
                정식 리그 시스템으로 운영되는<br />공식 레이싱 이벤트
              </p>
              <div className="text-purple-300 text-sm font-semibold">
                모든 게임 통합 페이지
              </div>
            </div>
          </div>
        </Link>

        {/* 기습 갤멀 */}
        <Link href="/multis" className="group">
          <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-orange-400 mb-2">기습 갤멀</h3>
              <p className="text-gray-300 text-sm mb-4">
                예고 없이 갑작스럽게 열리는<br />일회성 레이싱 이벤트
              </p>
              <div className="text-orange-300 text-sm font-semibold">
                시간 기반 필터링
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
