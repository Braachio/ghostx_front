'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

interface Multi {
  id: number
  title: string
  game: string
  multi_name: string
  multi_day: string[]
  multi_time: string
  is_open: boolean
  description: string
  created_at: string
}

export default function MultiDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [multi, setMulti] = useState<Multi | null>(null)

  useEffect(() => {
    const fetchDetail = async () => {
      const res = await fetch(`/api/multis/${id}`)
      const data = await res.json()
      setMulti(data)
    }
    fetchDetail()
  }, [id])

  if (!multi) return <p className="p-6">불러오는 중...</p>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => router.back()} className="mb-4 text-blue-600 underline">← 뒤로가기</button>
      <h1 className="text-2xl font-bold mb-2">{multi.title}</h1>
      <p className="text-sm text-gray-500 mb-4">{new Date(multi.created_at).toLocaleString()}</p>
      <p>🎮 <strong>게임:</strong> {multi.game}</p>
      <p>🧭 <strong>멀티명:</strong> {multi.multi_name}</p>
      <p>📅 <strong>요일:</strong> {multi.multi_day.join(', ')}</p>
      <p>🕒 <strong>시간:</strong> {multi.multi_time}</p>
      <p>🔓 <strong>오픈:</strong> {multi.is_open ? '✅ ON' : '❌ OFF'}</p>
      <p className="mt-4 whitespace-pre-line">{multi.description}</p>
    </div>
  )
}