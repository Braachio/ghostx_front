'use client'

import { useState } from 'react'
import { supabase } from 'lib/supabaseClient'

export default function NewEventPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !startDate || !endDate) {
      setMessage('제목과 날짜는 필수입니다.')
      return
    }

    const { error } = await supabase.from('events').insert([
      {
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        status: 'open',
      },
    ])

    if (error) {
      setMessage(`에러: ${error.message}`)
    } else {
      setMessage('이벤트가 성공적으로 생성되었습니다!')
      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-4">새 이벤트 생성</h1>
      <form onSubmit={handleCreateEvent} className="space-y-4">
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
        <div className="flex space-x-2">
          <input
            type="date"
            className="w-1/2 p-2 border rounded"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="w-1/2 p-2 border rounded"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          이벤트 생성
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
