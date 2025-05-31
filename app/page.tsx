'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([])

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
              <Link href={`/events/${event.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
                {event.title}
              </Link>
              <p className="text-sm text-gray-600">{event.start_date} ~ {event.end_date}</p>
              <p className="mt-2 text-gray-700">{event.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
