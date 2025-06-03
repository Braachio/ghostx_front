'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import { Database } from '@/lib/database.types'
import type { User } from '@supabase/supabase-js'

type Event = Database['public']['Tables']['events']['Row']

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchEvents()
    checkUser()
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'open')
      .order('start_date', { ascending: false })

    if (error) {
      console.error('이벤트 불러오기 오류:', error)
    } else {
      setEvents(data ?? [])
    }
  }

  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) {
      console.error('사용자 확인 오류:', error?.message)
      setUser(null)
      setIsAdmin(false)
      return
    }

    setUser(data.user)

    // 사용자 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile && profile.role === 'admin') {
      setIsAdmin(true)
    } else {
      setIsAdmin(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏁 심레이싱 이벤트</h1>

      {user ? (
        isAdmin && (
          <Link
            href="/multis/new"
            className="inline-block mb-6 px-4 py-2 bg-blue-600 text-white rounded"
          >
            공지 등록
          </Link>
        )
      ) : (
        <Link
          href="/login"
          className="inline-block mb-6 px-4 py-2 bg-gray-600 text-white rounded"
        >
          로그인
        </Link>
      )}

      {events.length === 0 ? (
        <p>진행 중인 이벤트가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border p-4 rounded hover:shadow">
              <Link
                href={`/events/${event.id}`}
                className="text-xl font-semibold text-white-600 hover:underline"
              >
                {event.title}
              </Link>
              <p className="text-sm text-white-600">
                {new Date(event.start_date).toLocaleDateString()} ~{' '}
                {new Date(event.end_date).toLocaleDateString()}
              </p>
              <p className="mt-2 text-white-700">{event.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
