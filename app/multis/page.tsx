'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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

export default function MultiListPage() {
  const [multis, setMultis] = useState<Multi[]>([])

  useEffect(() => {
    const fetchMultis = async () => {
      const res = await fetch('/api/multis')
      const data = await res.json()
      setMultis(data)
    }

    fetchMultis()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">멀티 공지 리스트</h1>
        <Link href="/multis/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            + 새 공지 등록
          </button>
        </Link>
      </div>

      {multis.length === 0 ? (
        <p className="text-gray-500">등록된 공지가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {multis.map((multi) => (
            <li key={multi.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <h2 className="text-xl font-semibold">{multi.title}</h2>
              <p className="text-sm text-gray-600 mb-2">{new Date(multi.created_at).toLocaleString()}</p>
              <p>🎮 <strong>게임:</strong> {multi.game}</p>
              <p>🧭 <strong>멀티명:</strong> {multi.multi_name}</p>
              <p>📅 <strong>요일:</strong> {multi.multi_day?.join(', ')}</p>
              <p>🕒 <strong>시간:</strong> {multi.multi_time}</p>
              <p>🔓 <strong>오픈 여부:</strong> {multi.is_open ? '✅ 오픈' : '❌ 닫힘'}</p>
              <p className="mt-2 text-gray-700 whitespace-pre-line">{multi.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
