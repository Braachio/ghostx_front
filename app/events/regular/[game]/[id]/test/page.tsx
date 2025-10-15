'use client'

import { useEffect, useState } from 'react'

interface TestPageProps {
  params: Promise<{ game: string; id: string }>
}

export default function TestPage({ params }: TestPageProps) {
  const [game, setGame] = useState<string>('')
  const [eventId, setEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [event, setEvent] = useState<{ title?: string } | null>(null)
  const [eventLoading, setEventLoading] = useState(false)

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

  // 사용자 정보 로드 테스트
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    }
    loadUser()
  }, [])

  // 이벤트 데이터 로드 테스트
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return

      try {
        setEventLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data = await response.json()
          const eventData = data.find((e: { id: string; title?: string }) => e.id === eventId)
          if (eventData) {
            setEvent(eventData)
          }
        }
      } catch (error) {
        console.error('이벤트 로드 실패:', error)
      } finally {
        setEventLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

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
        <h1 className="text-3xl font-bold mb-8">테스트 페이지 - 이벤트 데이터 로드 추가</h1>
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <p>게임: {game}</p>
          <p>이벤트 ID: {eventId}</p>
          <p>사용자: {user ? user.id : '로그인되지 않음'}</p>
          <p>이벤트 로딩: {eventLoading ? '로딩 중...' : '완료'}</p>
          <p>이벤트 데이터: {event ? event.title || '제목 없음' : '없음'}</p>
          <p className="text-green-400 mt-4">✅ 이벤트 데이터 로드까지 정상 작동!</p>
        </div>
      </div>
    </div>
  )
}
