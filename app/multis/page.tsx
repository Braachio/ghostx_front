'use client'

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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">멀티 공지 리스트</h1>
      <ul className="space-y-4">
        {multis.map((multi) => (
          <li key={multi.id} className="border rounded p-4">
            <h2 className="text-lg font-semibold">{multi.title}</h2>
            <p>게임: {multi.game}</p>
            <p>멀티명: {multi.multi_name}</p>
            <p>요일: {multi.multi_day?.join(', ')}</p>
            <p>시간: {multi.multi_time}</p>
            <p>오픈 여부: {multi.is_open ? '✅ 오픈' : '❌ 닫힘'}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
