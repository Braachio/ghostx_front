'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'

type Event = Database['public']['Tables']['events']['Row']

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'open')
      .order('start_date', { ascending: false })

    if (!error && data) {
      setEvents(data)
    } else {
      console.error('이벤트 불러오기 오류:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏁 심레이싱 이벤트</h1>

      {events.length === 0 ? (
        <p>진행 중인 이벤트가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border p-4 rounded hover:shadow">
              <Link href={`/events/${event.id}`} className="text-xl font-semibold text-white-600 hover:underline">
                {event.title}
              </Link>
              <p className="text-sm text-white-600">
                {new Date(event.start_date).toLocaleDateString()} ~ {new Date(event.end_date).toLocaleDateString()}
              </p>
              <p className="mt-2 text-white-700">{event.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
