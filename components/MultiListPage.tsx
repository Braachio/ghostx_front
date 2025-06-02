'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  const [grouped, setGrouped] = useState<Record<string, Multi[]>>({})

  useEffect(() => {
    const fetchMultis = async () => {
      const res = await fetch('/api/multis')
      const data: Multi[] = await res.json()

      const groupedByGame: Record<string, Multi[]> = {}
      data.forEach((multi) => {
        if (!groupedByGame[multi.game]) {
          groupedByGame[multi.game] = []
        }
        groupedByGame[multi.game].push(multi)
      })

      setGrouped(groupedByGame)
    }

    fetchMultis()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎮 멀티 공지 리스트</h1>
        <Link href="/multis/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            + 새 공지 등록
          </button>
        </Link>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500">등록된 공지가 없습니다.</p>
      ) : (
        Object.entries(grouped).map(([game, notices]) => (
          <div key={game} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 border-b pb-1">{game}</h2>
            <ul className="space-y-4">
              {notices.map((multi) => (
                <li
                  key={multi.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-lg font-bold">{multi.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(multi.created_at).toLocaleString()}
                  </p>
                  <p>🧭 <strong>멀티명:</strong> {multi.multi_name}</p>
                  <p>📅 <strong>오픈 요일:</strong> {multi.multi_day?.join(', ')}</p>
                  <p>🕒 <strong>오픈 시간:</strong> {multi.multi_time}</p>
                  <p>🔓 <strong>오픈 여부:</strong> {multi.is_open ? '✅ ON' : '❌ OFF'}</p>
                  <p className="mt-2 text-gray-550 whitespace-pre-line">{multi.description}</p>

                  {/* 수정/삭제 버튼 영역 */}
                  <div className="mt-4 flex">
                    <Link href={`/multis/${multi.id}/edit`}>
                      <button className="mr-2 bg-yellow-500 text-white px-2 py-1 rounded">수정</button>
                    </Link>
                    <button
                      onClick={async () => {
                        if (confirm('정말 삭제하시겠습니까?')) {
                          const res = await fetch(`/api/multis/${multi.id}`, {
                            method: 'DELETE',
                          })
                          if (res.ok) {
                            alert('삭제 완료')
                            location.reload()
                          } else {
                            alert('삭제 실패')
                          }
                        }
                      }}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
