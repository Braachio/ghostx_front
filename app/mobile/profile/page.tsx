'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import MobileProfilePanel from '@/components/mobile/MobileProfilePanel'

interface User {
  id: string
  nickname: string
  email: string
  role: string
}

export default function MobileProfilePage() {
  const supabase = useSupabaseClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/me')
      if (res.ok) {
        const { user } = await res.json()
        setUser(user)
      } else {
        setUser(null)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.href = '/mobile'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white px-4 py-24">
      <div className="max-w-lg mx-auto">
        <MobileProfilePanel user={user} language="ko" onLogout={handleLogout} />
      </div>
    </div>
  )
}
