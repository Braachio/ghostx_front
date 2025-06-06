// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1. Supabase Auth 회원가입
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message || '회원가입 실패')
      setLoading(false)
      return
    }

    const userId = data.user.id
    console.log('auth user id:', data.user.id)

    // 2. profiles 테이블에 닉네임 저장
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      nickname,
    })

    if (profileError) {
      setError(profileError.message)
    } else {
      alert('회원가입 성공! 이메일 인증을 완료해 주세요.')
      router.push('/login')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">회원가입</h2>
      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  )
}
