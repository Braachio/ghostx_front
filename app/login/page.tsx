'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      alert('로그인 성공')
      router.push('/')
    } else {
      alert(`로그인 실패: ${data.error}`)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleLogin}
        className="flex flex-col gap-4 w-full max-w-md p-6 bg-white dark:bg-gray-800 shadow-md rounded"
      >
        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white">🔐 로그인</h2>

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          로그인
        </button>
      </form>
    </div>
  )
}
