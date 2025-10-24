'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EventManagerApplicationForm from 'components/EventManagerApplicationForm'

interface User {
  id: string
  nickname: string
  role: string
}

export default function EventManagerApplicationPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasExistingApplication, setHasExistingApplication] = useState(false)
  const [existingApplication, setExistingApplication] = useState<{
    id: string
    status: string
    created_at: string
    review_notes?: string
  } | null>(null)

  useEffect(() => {
    checkUserAndApplication()
  }, [checkUserAndApplication])

  const checkUserAndApplication = async () => {
    try {
      // 사용자 정보 확인
      const userResponse = await fetch('/api/me')
      if (!userResponse.ok) {
        router.push('/login')
        return
      }

      const userData = await userResponse.json()
      setUser(userData.user)

      // 이미 빵장인지 확인
      if (userData.user.role === 'event_manager' || userData.user.role === 'admin') {
        setMessage('이미 빵장 권한이 있습니다.')
        return
      }

      // 기존 신청서 확인
      const applicationResponse = await fetch('/api/event-manager-applications')
      if (applicationResponse.ok) {
        const applicationData = await applicationResponse.json()
        if (applicationData.applications && applicationData.applications.length > 0) {
          const pendingApplication = applicationData.applications.find((app: { status: string }) => app.status === 'pending')
          if (pendingApplication) {
            setHasExistingApplication(true)
            setExistingApplication(pendingApplication)
          }
        }
      }
    } catch (error) {
      console.error('사용자 확인 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const [message, setMessage] = useState('')

  const handleSuccess = () => {
    setMessage('빵장 신청이 완료되었습니다. 관리자 검토 후 결과를 알려드리겠습니다.')
    setHasExistingApplication(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">빵장 신청을 하려면 로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  if (user.role === 'event_manager' || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">이미 빵장 권한이 있습니다</h1>
          <p className="text-gray-600 mb-6">현재 빵장 권한을 가지고 있습니다.</p>
          <button
            onClick={() => router.push('/profile')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            프로필로 이동
          </button>
        </div>
      </div>
    )
  }

  if (hasExistingApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">빵장 신청 현황</h1>
          
          {existingApplication && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">신청 정보</h3>
              <p className="text-sm text-gray-600 mb-2">
                <strong>신청일:</strong> {new Date(existingApplication.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>상태:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  existingApplication.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : existingApplication.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {existingApplication.status === 'pending' ? '검토 중' : 
                   existingApplication.status === 'approved' ? '승인됨' : '거부됨'}
                </span>
              </p>
              {existingApplication.review_notes && (
                <p className="text-sm text-gray-600">
                  <strong>검토 의견:</strong> {existingApplication.review_notes}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => router.push('/profile')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              프로필로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">빵장 신청</h1>
          <p className="mt-2 text-lg text-gray-600">
            갤멀을 관리하고 운영하는 빵장이 되어보세요
          </p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md max-w-2xl mx-auto">
            <p className="text-sm text-yellow-700">
              <strong>⚠️ 현재 정기 갤멀 운영 중인 빵장만 신청할 수 있습니다.</strong> 
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        <EventManagerApplicationForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
