'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SubmitRecordPage() {
  const [nickname, setNickname] = useState('')
  const [lapTime, setLapTime] = useState('')
  const [proofLink, setProofLink] = useState('')
  const [eventId, setEventId] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nickname || !lapTime || !proofLink || !eventId) {
      setMessage('모든 필드를 입력해주세요.')
      return
    }

    const { error } = await supabase.from('records').insert([
      {
        nickname,
        lap_time: parseFloat(lapTime),
        proof_link: proofLink,
        event_id: eventId,
      },
    ])

    if (error) {
      setMessage(`에러: ${error.message}`)
    } else {
      setMessage('기록이 성공적으로 제출되었습니다!')
      setNickname('')
      setLapTime('')
      setProofLink('')
      setEventId('')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded">
      <h1 className="text-2xl font-bold mb-4">타임 트라이얼 기록 제출</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="이벤트 ID"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="랩타임 (초)"
          type="number"
          value={lapTime}
          onChange={(e) => setLapTime(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="증빙 링크 (예: 유튜브)"
          value={proofLink}
          onChange={(e) => setProofLink(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          제출하기
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
