'use client'

import { JSX, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AnonymousChat from './AnonymousChat'
import ParticipantsList from './ParticipantsList'

function linkify(text: string): JSX.Element[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    urlRegex.lastIndex = 0
    return urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all dark:text-blue-400"
      >
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    )
  })
}

interface Multi {
  id: number
  title: string
  game: string
  multi_race?: string
  multi_class?: string
  game_track?: string
  multi_name?: string
  multi_day: string[]
  multi_time: string | null
  is_open: boolean
  description: string | null
  created_at: string
  author_id: string | null
  link?: string
}

interface MeResponse {
  id: string
  username: string
}

export default function MultiDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [multi, setMulti] = useState<Multi | null>(null)
  const [user, setUser] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [multiRes, meRes] = await Promise.all([
          fetch(`/api/multis/${id}`),
          fetch('/api/me'),
        ])

        if (!multiRes.ok) {
          const err = await multiRes.json()
          throw new Error(err.error || '공지 데이터를 불러오지 못했습니다.')
        }

        const multiData = await multiRes.json()
        setMulti(multiData.data)

        if (meRes.ok) {
          const meData = await meRes.json()
          setUser(meData.user)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      }
    }

    if (id) fetchData()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    const res = await fetch(`/api/multis/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
    })

    if (res.ok) {
      alert('삭제되었습니다.')
      router.push('/multis')
    } else {
      const { error } = await res.json()
      alert(`삭제 실패: ${error}`)
    }
  }

  if (error) return <p className="p-6 text-red-500 dark:text-red-400">⚠️ {error}</p>
  if (!multi) return <p className="p-6 text-gray-700 dark:text-gray-300">불러오는 중...</p>

  const formattedDate = new Date(multi.created_at)
  const isValidDate = !isNaN(formattedDate.getTime())
  const isAuthor = user && multi.author_id === user.id

  // 게임별 아이콘 매핑
  const getGameIcon = (game: string) => {
    const gameIcons: Record<string, string> = {
      '컴페티치오네': '🏁',
      '아세토코르사': '🏎️',
      '그란투리스모7': '🏆',
      '르망얼티밋': '🏁',
      'EA WRC': '🌲',
      '아이레이싱': '🏁',
      '알펙터2': '🏁'
    }
    return gameIcons[game] || '🏁'
  }

  return (
    <div className="bg-black min-h-screen relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-700"></div>
        
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-16 gap-6 h-full">
            {Array.from({ length: 256 }).map((_, i) => (
              <div key={i} className="border border-gray-600"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-6 relative z-10">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/multis">
            <button className="mb-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 font-semibold">
              ← 목록으로 돌아가기
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 이벤트 헤더 */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-xl p-6 shadow-2xl shadow-cyan-500/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl">{getGameIcon(multi.game)}</div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{multi.title}</h1>
                  <div className="flex items-center gap-4 text-gray-300">
                    <span className="bg-cyan-600/20 px-3 py-1 rounded-lg text-sm">{multi.game}</span>
                    <span className="text-sm">
                      {isValidDate ? formattedDate.toLocaleString('ko-KR') : '날짜 정보 없음'}
                    </span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  multi.is_open 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {multi.is_open ? '✅ 활성' : '❌ 비활성'}
                </div>
              </div>
            </div>

            {/* 이벤트 정보 */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-blue-500/30 rounded-xl p-6 shadow-2xl shadow-blue-500/10">
              <h2 className="text-xl font-bold text-white mb-4">🏁 이벤트 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400">🏁</span>
                    <span className="text-gray-300">트랙:</span>
                    <span className="text-white font-medium">{multi.game_track || '미정'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">🚗</span>
                    <span className="text-gray-300">클래스:</span>
                    <span className="text-white font-medium">{multi.multi_class || '미정'}</span>
                  </div>
                  {multi.multi_race && (
                    <div className="flex items-center gap-3">
                      <span className="text-purple-400">🏆</span>
                      <span className="text-gray-300">레이스:</span>
                      <span className="text-white font-medium">{multi.multi_race}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400">📅</span>
                    <span className="text-gray-300">요일:</span>
                    <span className="text-white font-medium">
                      {multi.multi_day.length > 0 ? multi.multi_day.join(', ') : '미정'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400">⏰</span>
                    <span className="text-gray-300">시간:</span>
                    <span className="text-white font-medium">{multi.multi_time || '미정'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-xl p-6 shadow-2xl shadow-purple-500/10">
              <h2 className="text-xl font-bold text-white mb-4">📝 상세 설명</h2>
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {multi.description ? linkify(multi.description) : '설명이 없습니다.'}
              </div>
            </div>
          </div>

          {/* 사이드바 - 커뮤니케이션 */}
          <div className="space-y-6">
            {/* 참가자 정보 */}
            {id && (
              <ParticipantsList eventId={id} />
            )}

            {/* 익명 채팅 */}
            <AnonymousChat eventId={id || ''} />

            {/* 액션 버튼들 */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-xl p-6 shadow-2xl shadow-orange-500/10">
              <h3 className="text-lg font-bold text-white mb-4">⚡ 액션</h3>
              <div className="space-y-3">
                {multi.link ? (
                  <a
                    href={multi.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-center"
                  >
                    🔗 참가하기
                  </a>
                ) : (
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all font-medium">
                    📝 참가 하기
                  </button>
                )}

                {isAuthor && (
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <Link href={`/multis/${multi.id}/edit`}>
                      <button className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all text-sm">
                        ✏️ 수정하기
                      </button>
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm"
                    >
                      🗑️ 삭제하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
