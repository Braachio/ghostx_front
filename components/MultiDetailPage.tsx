'use client'

import { JSX, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function linkify(text: string): JSX.Element[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) =>
    urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline break-all"
      >
        {part}
      </a>
    ) : (
      <span key={index}>{part}</span>
    )
  )
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

  if (error) return <p className="p-6 text-red-500">⚠️ {error}</p>
  if (!multi) return <p className="p-6">불러오는 중...</p>

  const formattedDate = new Date(multi.created_at)
  const isValidDate = !isNaN(formattedDate.getTime())
  const isAuthor = user && multi.author_id === user.id

  return (
    <div className="max-w-3xl mx-auto p-6 relative min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-2">{multi.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {isValidDate ? formattedDate.toLocaleString() : '날짜 정보 없음'}
      </p>

      <p><strong>게임:</strong> {multi.game}</p>
      {multi.game_track && <p><strong>트랙:</strong> {multi.game_track}</p>}
      {multi.multi_race && <p><strong>레이스:</strong> {multi.multi_race}</p>}
      {multi.multi_class && <p><strong>클래스:</strong> {multi.multi_class}</p>}
      <p>
        <strong>오픈 시간:</strong>{' '}
        {multi.multi_day.length > 0 ? multi.multi_day.join(', ') : '요일 없음'}{' '}
        {multi.multi_time ?? ''}
      </p>
      <p><strong>오픈 여부:</strong> {multi.is_open ? '✅' : '❌'}</p>

      <hr className="my-4 border-t border-gray-300" />

      <div className="whitespace-pre-wrap flex-1">
        {multi.description ? linkify(multi.description) : '설명이 없습니다.'}
      </div>

      <hr className="my-4 border-t border-gray-300" />
      
      <div className="flex justify-between items-center mt-6">
        <Link href="/multis">
          <button className="bg-gray-500 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-600">
            목록
          </button>
        </Link>

        {isAuthor && (
          <div className="flex space-x-3">
            <Link href={`/multis/${multi.id}/edit`}>
              <button className="bg-gray-500 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-600">
                수정
              </button>
            </Link>
            <button
              onClick={handleDelete}
              className="bg-gray-600 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-700"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
