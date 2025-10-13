'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import EventCard from '@/components/EventCard'
import VotingPanel from '@/components/VotingPanel'
import { MultiWithTemplate } from '@/types/events'

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

interface RegularEventDetailPageProps {
  params: Promise<{ game: string; id: string }>
}

export default function RegularEventDetailPage({ params }: RegularEventDetailPageProps) {
  const [game, setGame] = useState<string>('')
  const [eventId, setEventId] = useState<string>('')
  const [event, setEvent] = useState<MultiWithTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setGame(resolvedParams.game)
      setEventId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!eventId) return

    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data: MultiWithTemplate[] = await response.json()
          
          // 해당 ID의 정기 이벤트 찾기
          const foundEvent = data.find(e => e.id === eventId && e.event_type === 'regular_schedule')
          
          if (foundEvent) {
            setEvent(foundEvent)
          } else {
            setError('이벤트를 찾을 수 없습니다.')
          }
        } else {
          setError('이벤트를 불러오는데 실패했습니다.')
        }
      } catch (error) {
        console.error('이벤트 조회 실패:', error)
        setError('이벤트를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-400 text-xl">👻 이벤트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-red-400">❌</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {error || '이벤트를 찾을 수 없습니다'}
          </h3>
          <Link 
            href={`/events/regular/${game}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const gameDisplayName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            {gameDisplayName} 정기 이벤트
          </h1>
          <p className="text-lg text-gray-300">
            매주 반복되는 정규 레이싱 이벤트
          </p>
        </div>

        {/* 네비게이션 */}
        <div className="flex justify-center gap-4 mb-8">
          <Link href={`/events/regular/${game}`}>
            <button className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-semibold">
              ← 목록으로
            </button>
          </Link>
          <Link href="/events">
            <button className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-semibold">
              🗓️ 다른 이벤트
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 이벤트 정보 */}
          <div className="lg:col-span-2">
            <EventCard multi={event} currentUserId={null} />
          </div>

          {/* 투표 패널 */}
          <div className="lg:col-span-1">
            <VotingPanel 
              regularEventId={event.id}
              weekNumber={undefined} // 현재 주차 자동 계산
              year={undefined} // 현재 연도 자동 계산
            />
          </div>
        </div>

        {/* 참가자 정보 */}
        <div className="mt-8 bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">👥 참가자 정보</h3>
          <p className="text-gray-400">
            Steam 로그인 후 참가신청을 완료한 사용자만 투표할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
