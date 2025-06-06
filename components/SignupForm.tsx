'use client'

import { useState } from 'react'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname }),
    })

    const result = await res.json()

    if (res.ok) {
      alert('회원가입 성공! 이메일 인증을 완료해 주세요.')
    } else {
      setError(result.error || '회원가입 실패')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-3 max-w-md mx-auto p-4">
      <input type="text" placeholder="닉네임" value={nickname} onChange={e => setNickname(e.target.value)} className="border p-2" required />
      <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="border p-2" required />
      <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="border p-2" required />
      <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
        {loading ? '가입 중...' : '회원가입'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </form>
  )
}
