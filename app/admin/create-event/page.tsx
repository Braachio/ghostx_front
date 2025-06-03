'use client'

import { useState } from 'react'
import { supabase } from 'lib/supabaseClient'

export default function CreateEventPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('open')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !startDate || !endDate) {
      setMessage('모든 항목을 입력해주세요.')
      return
    }

    const { error } = await supabase.from('events').insert([
      {
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        status,
      },
    ])

    if (error) {
      setMessage(`에러: ${error.message}`)
    } else {
      setMessage('이벤트가 성공적으로 등록되었습니다!')
      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-4">🛠️ 이벤트 등록 (Admin 전용)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="이벤트 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 border rounded"
          placeholder="이벤트 설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="open">진행 중</option>
          <option value="closed">종료됨</option>
        </select>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          이벤트 등록
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
