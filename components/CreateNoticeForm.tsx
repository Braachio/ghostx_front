'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateGameNoticeForm() {
  const [game, setGame] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const allGames = [
    '컴페티치오네',
    '아세토코르사',
    '그란투리스모7',
    '르망얼티밋',
    'EA WRC',
    '아이레이싱',
    '알펙터2',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/game-notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game, title, content }),
    })

    let result = null
    try {
        result = await res.json()
    } catch (error) {
        console.error('❌ JSON 파싱 실패:', error)
    }

    if (res.ok && result?.success) {
        setMessage('✅ 공지가 등록되었습니다.')
        setGame('')
        setTitle('')
        setContent('')
        router.push('/multis')
    } else {
        setMessage('❌ 등록 실패')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">대표 공지 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">게임 선택</label>
          <select value={game} onChange={e => setGame(e.target.value)} className="w-full border p-2 rounded">
            <option value="">게임 선택</option>
            {allGames.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">제목</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full border p-2 rounded"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          등록
        </button>
        {message && <p className="mt-2 text-sm">{message}</p>}
      </form>
    </div>
  )
}
