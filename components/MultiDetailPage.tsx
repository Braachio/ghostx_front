'use client'

import { JSX, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ✅ 링크 자동 변환 함수
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
  multi_class?: string
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
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('알 수 없는 오류가 발생했습니다.')
        }
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
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => router.back()} className="mb-4 text-blue-600 underline">
        ← 뒤로가기
      </button>

      <h1 className="text-2xl font-bold mb-2">{multi.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {isValidDate ? formattedDate.toLocaleString() : '날짜 정보 없음'}
      </p>

      <p>🎮 <strong>게임:</strong> {multi.game}</p>
      {multi.multi_class && <p>🧭 <strong>클래스:</strong> {multi.multi_class}</p>}
      {multi.multi_name && <p>🧭 <strong>멀티명:</strong> {multi.multi_name}</p>}
      <p>📅 <strong>요일:</strong> {multi.multi_day.length > 0 ? multi.multi_day.join(', ') : '없음'}</p>
      <p>🕒 <strong>시간:</strong> {multi.multi_time || '미입력'}</p>
      <p>🔓 <strong>오픈:</strong> {multi.is_open ? '✅ ON' : '❌ OFF'}</p>

      <div className="mt-4 whitespace-pre-wrap">
        {multi.description ? linkify(multi.description) : '설명이 없습니다.'}
      </div>

      {isAuthor && (
        <div className="mt-6 flex space-x-4">
          <Link href={`/multis/${multi.id}/edit`}>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded">수정</button>
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}
