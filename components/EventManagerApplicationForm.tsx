'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventManagerApplicationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EventManagerApplicationForm({ 
  onSuccess, 
  onCancel 
}: EventManagerApplicationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  // const [verificationCode, setVerificationCode] = useState('')
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  
  const [formData, setFormData] = useState({
    gallery_nickname: '',
    gallery_gallog_id: '',
    gallery_verification_code: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/event-manager-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || '빵장 신청이 완료되었습니다.')
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/profile')
        }
      } else {
        setMessage(data.error || '신청 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('신청 오류:', error)
      setMessage('신청 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const sendVerificationCode = async () => {
    if (!formData.gallery_nickname.trim()) {
      setMessage('갤러리 닉네임을 먼저 입력해주세요.')
      return
    }

    if (!formData.gallery_gallog_id.trim()) {
      setMessage('갤로그 식별 코드를 입력해주세요.')
      return
    }

    setIsGeneratingCode(true)
    try {
      const response = await fetch('/api/gallog-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gallery_nickname: formData.gallery_nickname,
          gallog_id: formData.gallery_gallog_id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(data.message)
        // setVerificationCode(data.verification_code) // 주석 처리됨
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || '인증 코드 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('인증 코드 전송 오류:', error)
      setMessage('인증 코드 전송 중 오류가 발생했습니다.')
    } finally {
      setIsGeneratingCode(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">빵장 신청</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="gallery_nickname" className="block text-sm font-medium text-gray-700 mb-2">
              갤로그 닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="gallery_nickname"
              name="gallery_nickname"
              value={formData.gallery_nickname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="갤러리에서 사용하는 닉네임"
              required
            />
          </div>

          <div>
            <label htmlFor="gallery_gallog_id" className="block text-sm font-medium text-gray-700 mb-2">
              갤로그 식별 코드 <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="gallery_gallog_id"
                name="gallery_gallog_id"
                value={formData.gallery_gallog_id}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="갤로그 URL의 식별 코드 (예: comic1164)"
                required
              />
              <button
                type="button"
                onClick={sendVerificationCode}
                disabled={isGeneratingCode || !formData.gallery_nickname.trim() || !formData.gallery_gallog_id.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingCode ? '전송 중...' : '인증코드 전송'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
            💡 갤로그 URL에서 식별 코드를 확인하세요. (예: https://gallog.dcinside.com/comic1164)
            </p>
          </div>

        <div>
          <label htmlFor="gallery_verification_code" className="block text-sm font-medium text-gray-700 mb-2">
            갤로그에서 받은 인증 코드 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="gallery_verification_code"
            name="gallery_verification_code"
            value={formData.gallery_verification_code}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="갤로그 방명록에서 받은 인증 코드를 입력하세요 (예: BAK12345678)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 갤로그 방명록의 비밀글에 있는 인증 코드를 복사하여 입력해주세요.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('완료') || message.includes('성공') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || !formData.gallery_nickname.trim() || !formData.gallery_verification_code.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '신청 중...' : '신청하기'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">빵장 신청 자격 기준</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Steam 로그인 사용자</li>
          <li>• 현재 정기 갤멀을 운영 중인 사용자</li>
        </ul>
      </div>
    </div>
  )
}
