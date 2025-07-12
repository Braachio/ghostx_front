'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/me')
        if (!res.ok) throw new Error('인증 필요')
        const result = await res.json()
        setNickname(result.user.nickname)
        setHasData(result.user.has_uploaded_data || false)
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('인증 오류:', err.message)
        }
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  if (loading) return <div className="p-6 text-center text-gray-500">로딩 중...</div>

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6 text-center"> {nickname}님, 환영합니다!</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">📊 데이터 상태</h2>
        <p className="text-gray-700 dark:text-gray-300">
          {hasData ? '✅ 데이터가 업로드되어 있습니다.' : '❌ 아직 주행 데이터가 없습니다.'}
        </p>
      </section>

      <section className="mb-4 space-y-3">
        <button
          onClick={() => router.push('/upload-id')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition"
        >
          📈 분석하러 가기
        </button>

        <button
          onClick={() => router.push('/multis')}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 rounded transition"
        >
          🗓️ 멀티 일정 보기
        </button>
      </section>

      <div className="mt-10 text-center">
        <button
          onClick={async () => {
            await fetch('/api/logout', { method: 'POST' })
            router.push('/login')
          }}
          className="text-sm text-gray-500 hover:underline"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}
