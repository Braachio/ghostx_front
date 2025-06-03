'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      const { access_token } = await res.json()   // ✅ 토큰 추출
      localStorage.setItem('access_token', access_token)  // ✅ 저장
      router.push('/')
    } else {
      const { error } = await res.json()
      setError(error)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">로그인</h1>

      <input
        type="text"
        placeholder="아이디"
        className="border p-2 w-full mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="비밀번호"
        className="border p-2 w-full mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        로그인
      </button>
    </div>
  )
}
