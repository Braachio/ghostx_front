'use client'

import { useEffect, useState } from 'react'

type Props = {
  id: string
  defaultData?: Notice
}

export type Notice = {
  id: string
  game: string
  title: string
  content: string
  created_at?: string
}

export default function EditNoticeForm({ id }: Props) {
  const [form, setForm] = useState<Notice | null>(null)

  useEffect(() => {
    const fetchNotice = async () => {
      const res = await fetch(`/api/game-notices/${id}`)
      const data = await res.json()
      setForm(data)
    }
    fetchNotice()
  }, [id])

  if (!form) return <p>불러오는 중...</p>

  const handleSubmit = async () => {
    await fetch(`/api/game-notices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    alert('공지 수정 완료!')
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">공지 수정</h1>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full p-2 mb-2 border"
      />
      <textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        className="w-full p-2 border"
        rows={6}
      />
      <button onClick={handleSubmit} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded">
        저장
      </button>
    </div>
  )
}
