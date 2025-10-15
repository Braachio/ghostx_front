'use client'

import { useState, useEffect } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export default function DebugUserPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createPagesBrowserClient<Database>()

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Supabase에서 직접 사용자 정보 가져오기
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('사용자 정보 가져오기 실패:', error)
          setUserInfo({ error: error.message })
          setLoading(false)
          return
        }

        if (user) {
          // 프로필 정보도 가져오기
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          setUserInfo({
            user: user,
            profile: profile
          })
        } else {
          setUserInfo({ message: '로그인되지 않음' })
        }
      } catch (error) {
        console.error('오류:', error)
        setUserInfo({ error: '오류 발생' })
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">사용자 정보 디버그</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">사용자 정보</h2>
          
          {userInfo?.error ? (
            <div className="text-red-400">
              <p>오류: {userInfo.error}</p>
            </div>
          ) : userInfo?.message ? (
            <div className="text-yellow-400">
              <p>{userInfo.message}</p>
            </div>
          ) : userInfo?.user ? (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-green-400 mb-2">🔑 사용자 ID (복사해서 사용하세요)</h3>
                <div className="bg-black p-3 rounded font-mono text-green-300 break-all">
                  {userInfo.user.id}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(userInfo.user.id)}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ID 복사하기
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">기본 정보</h3>
                  <div className="space-y-2 text-white">
                    <p><strong>이메일:</strong> {userInfo.user.email || 'N/A'}</p>
                    <p><strong>이메일 확인:</strong> {userInfo.user.email_confirmed_at ? '✅' : '❌'}</p>
                    <p><strong>생성일:</strong> {new Date(userInfo.user.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">프로필 정보</h3>
                  <div className="space-y-2 text-white">
                    {userInfo.profile ? (
                      <>
                        <p><strong>닉네임:</strong> {userInfo.profile.nickname || 'N/A'}</p>
                        <p><strong>역할:</strong> {userInfo.profile.role || 'user'}</p>
                        <p><strong>데이터 업로드:</strong> {userInfo.profile.has_uploaded_data ? '✅' : '❌'}</p>
                        <p><strong>약관 동의:</strong> {userInfo.profile.agreed_terms ? '✅' : '❌'}</p>
                      </>
                    ) : (
                      <p className="text-yellow-400">프로필 정보 없음</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">환경변수 설정</h3>
                <div className="bg-black p-3 rounded font-mono text-orange-300">
                  <p># .env.local 파일에 추가하세요:</p>
                  <p>ADMIN_UID={userInfo.user.id}</p>
                  <p>ADMIN_PASSWORD=admin123</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300"
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
