'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // URL 파라미터에서 에러 메시지 읽기
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const detailsParam = searchParams.get('details')
    
    if (errorParam) {
      const errorMessages: { [key: string]: string } = {
        'steam_auth_failed': 'Steam 인증에 실패했습니다.',
        'invalid_steam_id': '유효하지 않은 Steam ID입니다.',
        'steam_validation_failed': 'Steam 검증에 실패했습니다.',
        'steam_user_info_failed': 'Steam 사용자 정보를 가져올 수 없습니다.',
        'database_error': '데이터베이스 오류가 발생했습니다. Steam API 키가 설정되어 있는지 확인해주세요.',
        'auth_failed': '인증에 실패했습니다.',
        'signup_failed': '회원가입에 실패했습니다. Steam API 키가 설정되어 있는지 확인해주세요.',
        'profile_creation_failed': '프로필 생성에 실패했습니다. 데이터베이스 마이그레이션이 필요할 수 있습니다.',
        'unexpected_error': '예상치 못한 오류가 발생했습니다.',
      }
      
      let errorMessage = errorMessages[errorParam] || '알 수 없는 오류가 발생했습니다.'
      
      // 상세 에러 정보가 있으면 추가
      if (detailsParam) {
        errorMessage += `\n\n상세 정보: ${decodeURIComponent(detailsParam)}`
      }
      
      setError(errorMessage)
    }
  }, [searchParams])

  const handleSteamLogin = () => {
    setLoading(true)
    // Steam OpenID 로그인 시작
    window.location.href = '/api/auth/steam'
  }

        const handleAnonymousLogin = async () => {
          setLoading(true)
          setError(null)
          
          try {
            // 먼저 현재 세션 상태 확인
            const sessionCheck = await fetch('/api/me')
            if (sessionCheck.ok) {
              // 이미 로그인된 상태면 바로 메인페이지로 이동
              router.push('/')
              return
            }
            
            // 저장된 익명 사용자 ID 가져오기
            const savedAnonymousId = localStorage.getItem('ghostx_anonymous_id')
            
            const response = await fetch('/api/auth/anonymous', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                savedAnonymousId: savedAnonymousId 
              }),
            })
      
            const data = await response.json()
      
            if (!response.ok) {
              setError(data.error || '익명 로그인에 실패했습니다.')
              setLoading(false)
              return
            }
      
            // 새로운 익명 사용자 ID가 반환되면 localStorage에 저장
            if (data.anonymousId) {
              localStorage.setItem('ghostx_anonymous_id', data.anonymousId)
            }
      
            // 익명 로그인 성공 - 메인페이지로 이동
            router.push('/')
          } catch (err) {
            console.error('익명 로그인 오류:', err)
            setError('익명 로그인 중 오류가 발생했습니다.')
            setLoading(false)
          }
        }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            🏁 GPX
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            시뮬레이션 레이싱 커뮤니티
          </p>
        </div>

        <div className="space-y-4">
          {/* Steam 로그인 */}
          <button
            type="button"
            onClick={handleSteamLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white py-4 px-6 rounded-lg hover:from-slate-800 hover:to-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 0 0-10 10v.26l5.38 2.23a2.88 2.88 0 0 1 1.62-.5c.19 0 .38.02.56.06l2.4-3.47v-.05a3.87 3.87 0 1 1 3.87 3.87h-.09l-3.42 2.44c0 .06.01.11.01.17a2.88 2.88 0 0 1-5.76 0v-.07L2 14.75A9.96 9.96 0 0 0 12 22a10 10 0 0 0 0-20zm-3.93 14.19l-1.23-.51a2.13 2.13 0 1 0 2.1 1.73l1.27.53a2.88 2.88 0 0 1-2.14-1.75zM15.87 9a2.59 2.59 0 1 0 2.59 2.59A2.59 2.59 0 0 0 15.87 9zm0 4.26a1.68 1.68 0 1 1 1.68-1.68 1.68 1.68 0 0 1-1.68 1.68z"/>
            </svg>
            <span className="text-lg font-medium">
              {loading ? '로그인 중...' : 'Steam으로 로그인'}
            </span>
          </button>

          {/* 익명 로그인 */}
          <button
            type="button"
            onClick={handleAnonymousLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-700 text-white py-4 px-6 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-lg font-medium">
              {loading ? '로그인 중...' : '익명으로 체험하기'}
            </span>
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-center text-sm whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Steam 로그인으로 모든 기능을 이용하거나<br />
            익명 로그인으로 미리 체험해보세요
          </p>
          <p className="mt-2 text-xs text-gray-400">
            💡 이미 로그인된 상태라면 해당 계정으로 자동 로그인됩니다
          </p>
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
