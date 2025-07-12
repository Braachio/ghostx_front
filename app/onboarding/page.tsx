'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/update-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      })

      const result = await res.json()

      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError(result.error || '닉네임 등록 실패')
      }
    } catch (err) {
    if (err instanceof Error) {
        console.error('닉네임 등록 오류:', err.message)
        setError(err.message)
    } else {
        console.error('알 수 없는 오류 발생:', err)
        setError('서버 오류가 발생했습니다.')
    }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded shadow text-black dark:text-white">
      <h1 className="text-xl font-bold mb-4 text-center">닉네임을 입력해주세요</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 레이서김"
          className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? '등록 중...' : '완료하고 시작하기'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  )
}
