'use client'

import { useEffect, useState } from 'react'

interface TestPageProps {
  params: Promise<{ game: string; id: string }>
}

export default function TestPage({ params }: TestPageProps) {
  const [game, setGame] = useState<string>('')
  const [eventId, setEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params
        setGame(resolvedParams.game)
        setEventId(resolvedParams.id)
        setLoading(false)
      } catch (error) {
        console.error('Params loading error:', error)
        setLoading(false)
      }
    }
    loadParams()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">테스트 페이지</h1>
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <p>게임: {game}</p>
          <p>이벤트 ID: {eventId}</p>
          <p className="text-green-400 mt-4">✅ 페이지가 정상적으로 로드되었습니다!</p>
        </div>
      </div>
    </div>
  )
}
