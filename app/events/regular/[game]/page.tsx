'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import WeeklyCalendar from '@/components/WeeklyCalendar'
import TrackHistoryPanel from '@/components/TrackHistoryPanel'
import { MultiWithTemplate } from '@/types/events'
import { hasEventManagementPermission } from '@/lib/client-permissions'

// 게임별 익명채팅 버튼 컴포넌트
const GameChatButton = ({ gameSlug, gameName }: { gameSlug: string; gameName: string }) => {
  const openChatInNewTab = () => {
    const chatUrl = `/events/regular/${gameSlug}/chat`
    window.open(chatUrl, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes')
  }

  return (
    <button
      onClick={openChatInNewTab}
      className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full shadow-lg transition-all hover:scale-105 z-50"
    >
      💬 {gameName} 채팅
    </button>
  )
}

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

interface RegularEventPageProps {
  params: Promise<{ game: string }>
}

export default function RegularEventPage({ params }: RegularEventPageProps) {
  const [game, setGame] = useState<string>('')
  const [events, setEvents] = useState<MultiWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [, setUser] = useState<{ id: string } | null>(null)
  const [hasManagementPermission, setHasManagementPermission] = useState(false)

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params

      // 한글/퍼센트 인코딩으로 들어온 값을 안전하게 디코딩하고 표준 슬러그로 변환
      const decoded = (() => {
        try {
          return decodeURIComponent(resolvedParams.game)
        } catch {
          return resolvedParams.game
        }
      })()

      // 한글 → 영문 슬러그 정규화 맵
      const toSlug: Record<string, string> = {
        '아이레이싱': 'iracing',
        '아세토코르사': 'assettocorsa',
        '그란투리스모7': 'gran-turismo7',
        '오토모빌리스타2': 'automobilista2',
        '컴페티치오네': 'competizione',
        '르망얼티밋': 'lemans',
        'F1 25': 'f1-25',
        'EA WRC': 'ea-wrc',
      }

      const normalized = toSlug[decoded] || decoded.toLowerCase()
      setGame(normalized)
    }
    loadParams()
  }, [params])

  // 사용자 정보 로드 및 권한 확인
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          
          // 권한 확인 (정기 이벤트 생성 권한)
          if (data.user) {
            const hasPermission = await hasEventManagementPermission(data.user.id)
            setHasManagementPermission(hasPermission)
          }
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!game) return

    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data: MultiWithTemplate[] = await response.json()
          console.log('전체 이벤트 데이터:', data)
          
          // 디버깅: event_type별로 데이터 확인
          const eventTypes = data.reduce((acc, item) => {
            acc[item.event_type] = (acc[item.event_type] || 0) + 1
            return acc
          }, {} as Record<string, number>)
          console.log('이벤트 타입별 개수:', eventTypes)
          
          // 해당 게임의 정기 갤멀만 필터링
          const gameName = gameNames[game]
          console.log('찾는 게임명:', gameName)
          
          // 해당 게임의 정기 이벤트만 필터링
          const regularEvents = data.filter(event => {
            console.log('이벤트 확인:', {
              game: event.game,
              gameName,
              event_type: event.event_type,
              matches: event.game === gameName && event.event_type === 'regular_schedule'
            })
            return event.game === gameName && event.event_type === 'regular_schedule'
          })
          
          console.log('필터링된 정기 이벤트:', regularEvents)
          console.log('WeeklyCalendar에 전달할 이벤트 데이터:', regularEvents)
          setEvents(regularEvents)
        }
      } catch (error) {
        console.error('정기 갤멀 조회 실패:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [game])


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-400 text-lg">정기 갤멀을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gameName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 - 고스트카 테마 */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-pulse">🏁</div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            {gameName.toUpperCase()}
          </h1>
          <div className="text-2xl font-semibold text-cyan-400 mb-2">REGULAR SCHEDULE</div>
          <p className="text-gray-400 text-lg">
            {events.length}개의 정기 이벤트 • 매주 정해진 시간
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex justify-center gap-4 mb-8">
          {hasManagementPermission && (
            <Link href={`/events/regular/${game}/new`}>
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/50 font-semibold">
                ➕ 정기 이벤트 추가
              </button>
            </Link>
          )}
          <Link href="/events">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/50 font-semibold">
              🗓️ 다른 이벤트 보기
            </button>
          </Link>
        </div>


        {/* 정기 갤멀 설명 카드 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">💡</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  정기 갤멀이란?
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  매주 정해진 시간에 열리는 정규 레이싱 이벤트입니다. 
                  일정이 고정되어 있어 언제든 참여할 수 있으며, 
                  지속적인 레이싱 경험을 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 주간 캘린더 */}
        {events.length > 0 ? (
          <div className="mb-12">
            <WeeklyCalendar 
              events={events} 
              gameName={gameName} 
              gameSlug={game}
            />
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 text-center mb-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-white mb-2">등록된 정기 이벤트가 없습니다</h3>
            <p className="text-gray-400 mb-6">
              {hasManagementPermission 
                ? "새로운 정기 이벤트를 등록해보세요!" 
                : "관리자나 방장이 정기 이벤트를 등록할 때까지 기다려주세요."
              }
            </p>
            {hasManagementPermission && (
              <Link
                href={`/events/regular/${game}/new`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
              >
                ➕ 정기 이벤트 추가
              </Link>
            )}
          </div>
        )}

        {/* 트랙 히스토리 패널 */}
        <div className="mb-12">
          <TrackHistoryPanel gameName={gameName} />
        </div>

      </div>

      {/* 게임별 익명채팅 */}
      <GameChatButton gameSlug={game} gameName={gameName} />
    </div>
  )
}
