'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // URL 파라미터에서 에러 메시지 읽기
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'steam_auth_failed': 'Steam 인증에 실패했습니다.',
        'invalid_steam_id': '유효하지 않은 Steam ID입니다.',
        'steam_validation_failed': 'Steam 검증에 실패했습니다.',
        'steam_user_info_failed': 'Steam 사용자 정보를 가져올 수 없습니다.',
        'database_error': '데이터베이스 오류가 발생했습니다. Steam API 키가 설정되어 있는지 확인해주세요.',
        'auth_failed': '인증에 실패했습니다.',
        'signup_failed': '회원가입에 실패했습니다.',
        'profile_creation_failed': '프로필 생성에 실패했습니다. 데이터베이스 마이그레이션이 필요할 수 있습니다.',
        'unexpected_error': '예상치 못한 오류가 발생했습니다.',
      }
      setError(errorMessages[errorParam] || '알 수 없는 오류가 발생했습니다.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '로그인 실패')
        return
      }

      // 로그인 성공 후 유저 인증 여부 확인
      const profileRes = await fetch('/api/me')
      const userData = await profileRes.json()

      const isVerified = !!userData.user?.email_confirmed_at

      router.push(isVerified ? '/dashboard' : '/onboarding')
    } catch (err) {
      console.error('로그인 오류:', err)
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }


  const handleSteamLogin = () => {
    // Steam OpenID 로그인 시작
    window.location.href = '/api/auth/steam'
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 shadow-md rounded">
        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-6">🔐 로그인</h2>

        {/* Steam 로그인 */}
        <button
          type="button"
          onClick={handleSteamLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white py-3 rounded hover:from-slate-800 hover:to-black transition-all flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 0 0-10 10v.26l5.38 2.23a2.88 2.88 0 0 1 1.62-.5c.19 0 .38.02.56.06l2.4-3.47v-.05a3.87 3.87 0 1 1 3.87 3.87h-.09l-3.42 2.44c0 .06.01.11.01.17a2.88 2.88 0 0 1-5.76 0v-.07L2 14.75A9.96 9.96 0 0 0 12 22a10 10 0 0 0 0-20zm-3.93 14.19l-1.23-.51a2.13 2.13 0 1 0 2.1 1.73l1.27.53a2.88 2.88 0 0 1-2.14-1.75zM15.87 9a2.59 2.59 0 1 0 2.59 2.59A2.59 2.59 0 0 0 15.87 9zm0 4.26a1.68 1.68 0 1 1 1.68-1.68 1.68 1.68 0 0 1-1.68 1.68z"/>
          </svg>
          Steam으로 로그인
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              또는 이메일로 로그인
            </span>
          </div>
        </div>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="border p-2 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="border p-2 rounded text-black dark:text-white dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '이메일로 로그인'}
          </button>

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
        </form>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          계정이 없으신가요?{' '}
          <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
            회원가입
          </a>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 shadow-md rounded">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
