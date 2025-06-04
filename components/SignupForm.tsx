'use client'

import { useState } from 'react'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    })

    const data = await res.json()

    if (res.ok) {
      alert('회원가입 성공')
    } else {
      alert(`회원가입 실패: ${data.error}`)
    }
  }

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-3 max-w-md mx-auto p-4">
      <input type="text" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="border p-2" required />
      <input type="text" placeholder="사용자 이름" value={username} onChange={e => setUsername(e.target.value)} className="border p-2" required />
      <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="border p-2" required />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">회원가입</button>
    </form>
  )
}
