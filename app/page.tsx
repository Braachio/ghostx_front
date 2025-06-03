'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('사용자 확인 오류:', error.message)
      setUser(null)
    } else {
      setUser(data.user ?? null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🏁 심레이싱 메인</h1>

      <div className="space-x-4 mb-6">
        <Link href="/events">
          <button className="px-4 py-2 bg-green-600 text-white rounded">이벤트 보기</button>
        </Link>
        <Link href="/multis">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">공지 모음</button>
        </Link>
        <Link href="/community">
          <button className="px-4 py-2 bg-purple-600 text-white rounded">커뮤니티</button>
        </Link>
      </div>

      {user ? (
        <Link
          href="/multis/new"
          className="inline-block mb-6 px-4 py-2 bg-blue-600 text-white rounded"
        >
          공지 등록
        </Link>
      ) : (
        <Link
          href="/login"
          className="inline-block mb-6 px-4 py-2 bg-gray-600 text-white rounded"
        >
          로그인
        </Link>
      )}
    </div>
  )
}
