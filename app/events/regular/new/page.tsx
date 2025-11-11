'use client'

import Link from 'next/link'
import BrandMark from '@/components/BrandMark'
import { useLanguage } from '@/hooks/useLanguage'

export default function RegularEventGameSelection() {
  const { language } = useLanguage()

  const games = [
    { id: 'iracing', name: '아이레이싱' },
    { id: 'assettocorsa', name: '아세토코르사' },
    { id: 'gran-turismo7', name: '그란투리스모7' },
    { id: 'competizione', name: '컴페티치오네' },
    { id: 'lemans', name: '르망얼티밋' },
    { id: 'f1-25', name: 'F1 25' },
    { id: 'automobilista2', name: '오토모빌리스타2' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* 상단 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <BrandMark size={32} textClassName="text-[12px]" />
              <span className="font-bold text-lg text-white">GPX</span>
            </Link>
            
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              ← 메인페이지로
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              정기 갤멀 생성
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              {language === 'ko' ? '어떤 게임을 선택하시겠습니까?' : 'Which game would you like to select?'}
            </p>
          </div>

          {/* 게임 선택 리스트 */}
          <div className="max-w-md mx-auto space-y-3">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/events/regular/${game.id}/new`}
                className="block w-full px-6 py-4 text-center text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-lg transition-all duration-200 font-medium"
              >
                {game.name}
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
