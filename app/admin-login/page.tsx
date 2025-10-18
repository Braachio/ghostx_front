'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [adminPassword, setAdminPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '관리자 로그인에 실패했습니다.')
        setLoading(false)
        return
      }

      // 로그인 성공 시 메인페이지로 이동
      router.push('/')
    } catch (error) {
      console.error('관리자 로그인 오류:', error)
      setError('네트워크 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-pulse">🔐</div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-4">
            관리자 로그인
          </h1>
          <p className="text-gray-400 text-lg">
            개발 환경 전용 관리자 로그인
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        </div>

        {/* 로그인 폼 */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-orange-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-red-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <form onSubmit={handleAdminLogin} className="space-y-6">
              {/* 경고 메시지 */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-400">⚠️</span>
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold text-yellow-300 mb-1">개발 환경 전용</p>
                    <p>이 기능은 개발 환경에서만 사용할 수 있습니다. 프로덕션에서는 비활성화됩니다.</p>
                  </div>
                </div>
              </div>

              {/* 관리자 비밀번호 */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  관리자 비밀번호 *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-white"
                  placeholder="관리자 비밀번호를 입력하세요"
                />
              </div>

              {/* 오류 메시지 */}
              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-lg shadow-red-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로그인 중...' : '관리자로 로그인'}
              </button>
            </form>

            {/* 기본 정보 */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="text-sm text-gray-400 space-y-2">
                <p><strong>기본 비밀번호:</strong> admin123</p>
                <p><strong>환경변수:</strong> ADMIN_PASSWORD로 설정 가능</p>
                <p><strong>개발용 관리자:</strong> 기존 관리자 계정으로 로그인합니다</p>
                <p><strong>관리자 ID:</strong> ea8c7783-ac7d-4c4e-95ca-676bc06c1b73</p>
              </div>
            </div>
          </div>
        </div>

        {/* 홈으로 돌아가기 */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
