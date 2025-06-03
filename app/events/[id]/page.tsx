'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from 'lib/supabaseClient'
import { Database } from '@/lib/database.types'

type Event = Database['public']['Tables']['events']['Row']
type Record = Database['public']['Tables']['records']['Row']

export default function EventDetailPage() {
  const params = useParams()
  const eventId = typeof params.id === 'string' ? params.id : params.id?.[0]
  const [event, setEvent] = useState<Event | null>(null)
  const [records, setRecords] = useState<Record[]>([])

  const fetchEvent = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (!error && data) {
      setEvent(data)
    } else {
      console.error('이벤트 정보 오류:', error)
    }
  }, [eventId])

  const fetchRecords = useCallback(async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('event_id', eventId)
      .order('lap_time', { ascending: true })

    if (!error && data) {
      setRecords(data)
    } else {
      console.error('기록 정보 오류:', error)
    }
  }, [eventId])

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      fetchRecords()
    }
  }, [eventId, fetchEvent, fetchRecords])

  if (!event) return <div className="p-4">이벤트 정보를 불러오는 중...</div>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
      <p className="text-gray-700 mb-4">{event.description}</p>
      <p className="text-sm text-gray-500 mb-6">
        {new Date(event.start_date).toLocaleDateString()} ~ {new Date(event.end_date).toLocaleDateString()}
      </p>

      <h2 className="text-xl font-semibold mb-3">🏁 기록 랭킹</h2>
      {records.length === 0 ? (
        <p>아직 제출된 기록이 없습니다.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2">순위</th>
              <th className="border px-3 py-2">닉네임</th>
              <th className="border px-3 py-2">랩타임 (초)</th>
              <th className="border px-3 py-2">링크</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id}>
                <td className="border px-3 py-2 text-center">{i + 1}</td>
                <td className="border px-3 py-2">{r.nickname}</td>
                <td className="border px-3 py-2 text-center">{parseFloat(r.lap_time.toString()).toFixed(3)}</td>
                <td className="border px-3 py-2 text-center">
                  <a href={r.proof_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">보기</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
