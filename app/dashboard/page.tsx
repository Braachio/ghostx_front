'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FAQ_LIST } from '@/components/faqData'


export default function DashboardPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFAQ, setShowFAQ] = useState(false)

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
      <h1 className="text-2xl font-bold mb-6 text-center">{nickname}님, 환영합니다!</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">📊 데이터 상태</h2>
        <p className="text-gray-700 dark:text-gray-300">
          {hasData ? '✅ 데이터가 업로드되어 있습니다.' : '❌ 준비 중입니다.'}
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

        <button
          onClick={() => setShowFAQ(true)}
          className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-2 rounded transition"
        >
          ❓ FAQ 보기
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

      {/* ✅ FAQ 모달 추가: return 내부 가장 마지막에 조건부 렌더링 */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-bold mb-4">❓ 자주 묻는 질문 (FAQ)</h2>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {FAQ_LIST.map((item, index) => (
                <div key={index}>
                  <strong>Q. {item.question}</strong>
                  <p className="pl-2">A. {item.answer}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowFAQ(false)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}
