'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function RegularEventGameSelection() {
  const [language] = useState<'ko' | 'en'>('ko')

  const games = [
    { id: 'iracing', name: '아이레이싱', icon: '🏎️', color: 'from-blue-500 to-cyan-500' },
    { id: 'assettocorsa', name: '아세토코르사', icon: '🏎️', color: 'from-green-500 to-emerald-500' },
    { id: 'gran-turismo7', name: '그란투리스모7', icon: '🏎️', color: 'from-purple-500 to-pink-500' },
    { id: 'competizione', name: '컴페티치오네', icon: '🏎️', color: 'from-orange-500 to-red-500' },
    { id: 'lemans', name: '르망얼티밋', icon: '🏎️', color: 'from-yellow-500 to-orange-500' },
    { id: 'f1-25', name: 'F1 25', icon: '🏎️', color: 'from-red-500 to-pink-500' },
    { id: 'automobilista2', name: '오토모빌리스타2', icon: '🏎️', color: 'from-indigo-500 to-purple-500' }
  ]

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
              href="/events"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              ← 이벤트 선택으로
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="text-6xl animate-pulse">📅</div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              정기 갤멀 생성
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              {language === 'ko' ? '어떤 게임을 선택하시겠습니까?' : 'Which game would you like to select?'}
            </p>
            <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          {/* 게임 선택 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/events/regular/${game.id}/new`}
                className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm hover:border-gray-600/60 transition-all duration-300">
                  <div className="text-center">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                      {game.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {game.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                      {language === 'ko' ? '정기 갤멀 생성하기' : 'Create Regular Gallery Multi'}
                    </p>
                    
                    {/* 호버 효과 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${game.color} text-white text-sm font-semibold rounded-lg`}>
                        <span>생성하기</span>
                        <span className="text-lg">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 추가 정보 */}
          <div className="mt-16 text-center">
            <div className="inline-block p-6 bg-gray-900/50 border border-gray-700 rounded-xl backdrop-blur-sm">
              <p className="text-gray-400 text-sm">
                💡 <span className="text-cyan-400 font-semibold">팁:</span> 게임을 선택하면 해당 게임의 정기 갤멀 생성 페이지로 이동합니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
