'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  user_id: string
  application_reason: string
  management_experience: string | null
  community_contributions: string | null
  recommender_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  user: {
    nickname: string
    email: string
  }
  recommender?: {
    nickname: string
  }
  reviewer?: {
    nickname: string
  }
}

export default function EventManagerApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch(`/api/event-manager-applications?status=${selectedStatus}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else if (response.status === 403) {
        router.push('/')
      }
    } catch (error) {
      console.error('신청서 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedStatus, router])

  useEffect(() => {
    fetchApplications()
  }, [selectedStatus, fetchApplications])

  const handleReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    setIsReviewing(true)
    try {
      const response = await fetch(`/api/event-manager-applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          review_notes: reviewNotes
        }),
      })

      const data = await response.json()
      if (response.ok) {
        alert(data.message)
        setSelectedApplication(null)
        setReviewNotes('')
        fetchApplications()
      } else {
        alert(data.error || '검토 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('검토 처리 오류:', error)
      alert('검토 처리 중 오류가 발생했습니다.')
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    const labels = {
      pending: '검토 중',
      approved: '승인됨',
      rejected: '거부됨'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">빵장 신청 관리</h1>
          <p className="mt-2 text-lg text-gray-600">
            빵장 신청서를 검토하고 승인/거부할 수 있습니다
          </p>
        </div>

        {/* 필터 */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? '전체' : 
                 status === 'pending' ? '검토 중' :
                 status === 'approved' ? '승인됨' : '거부됨'}
              </button>
            ))}
          </div>
        </div>

        {/* 신청서 목록 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">신청서가 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.user.nickname}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {application.user.email}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {application.application_reason}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        신청일: {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                      >
                        상세보기
                      </button>
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReview(application.id, 'approved')}
                            className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReview(application.id, 'rejected')}
                            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                          >
                            거부
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 상세보기 모달 */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  신청서 상세보기
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">신청자</label>
                    <p className="text-sm text-gray-900">{selectedApplication.user.nickname} ({selectedApplication.user.email})</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">신청 이유</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApplication.application_reason}</p>
                  </div>
                  
                  {selectedApplication.management_experience && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">관리 경험</label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApplication.management_experience}</p>
                    </div>
                  )}
                  
                  {selectedApplication.community_contributions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">커뮤니티 기여도</label>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApplication.community_contributions}</p>
                    </div>
                  )}
                  
                  {selectedApplication.recommender && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">추천인</label>
                      <p className="text-sm text-gray-900">{selectedApplication.recommender.nickname}</p>
                    </div>
                  )}
                  
                  {selectedApplication.status !== 'pending' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">검토 의견</label>
                      <p className="text-sm text-gray-900">{selectedApplication.review_notes || '검토 의견이 없습니다.'}</p>
                    </div>
                  )}
                </div>

                {selectedApplication.status === 'pending' && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">검토 의견</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="검토 의견을 입력해주세요 (선택사항)"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setSelectedApplication(null)
                      setReviewNotes('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    닫기
                  </button>
                  
                  {selectedApplication.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(selectedApplication.id, 'approved')}
                        disabled={isReviewing}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {isReviewing ? '처리 중...' : '승인'}
                      </button>
                      <button
                        onClick={() => handleReview(selectedApplication.id, 'rejected')}
                        disabled={isReviewing}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {isReviewing ? '처리 중...' : '거부'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
