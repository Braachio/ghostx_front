'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GallogTestPage() {
  const router = useRouter()
  const [testNickname, setTestNickname] = useState('')
  const [testGallogId, setTestGallogId] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/gallog-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_nickname: testNickname,
          test_gallog_id: testGallogId
        }),
      })

      const data = await response.json()
      setTestResult(data)

      if (response.ok) {
        console.log('갤로그 API 테스트 성공:', data)
      } else {
        console.error('갤로그 API 테스트 실패:', data)
      }
    } catch (error) {
      console.error('갤로그 API 테스트 오류:', error)
      setTestResult({
        success: false,
        error: '테스트 중 오류가 발생했습니다.'
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">갤로그 API 테스트</h1>
          <p className="mt-2 text-lg text-gray-600">
            갤로그 방명록 API 연동을 테스트합니다
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleTest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="test_nickname" className="block text-sm font-medium text-gray-700 mb-2">
                    갤로그 닉네임
                  </label>
                  <input
                    type="text"
                    id="test_nickname"
                    value={testNickname}
                    onChange={(e) => setTestNickname(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="갤로그 닉네임을 입력하세요"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="test_gallog_id" className="block text-sm font-medium text-gray-700 mb-2">
                    갤로그 식별 코드
                  </label>
                  <input
                    type="text"
                    id="test_gallog_id"
                    value={testGallogId}
                    onChange={(e) => setTestGallogId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: comic1164"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 갤로그 URL에서 식별 코드를 확인하세요. (예: https://gallog.dcinside.com/comic1164)
              </p>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isTesting || !testNickname.trim() || !testGallogId.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? '테스트 중...' : '갤로그 API 테스트'}
                </button>
              </div>
            </form>

            {testResult && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">테스트 결과</h3>
                <div className={`p-4 rounded-md ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {testResult.success ? (
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <h4 className={`text-sm font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? '테스트 성공' : '테스트 실패'}
                        {testResult.details?.method && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {testResult.details.method === 'API' ? 'API 방식' : 
                             testResult.details.method === 'WebScraping' ? '웹 스크래핑 방식' : 
                             testResult.details.method}
                          </span>
                        )}
                      </h4>
                      <div className={`mt-2 text-sm ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        <p>{testResult.message || testResult.error}</p>
                        {testResult.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-medium">상세 정보</summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(testResult.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">갤로그 하이브리드 테스트 가이드</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>1단계:</strong> API 방식으로 빠른 전송 시도</li>
                <li>• <strong>2단계:</strong> API 실패 시 웹 스크래핑 방식으로 폴백</li>
                <li>• <strong>API 방식:</strong> 빠르고 효율적, 서버 친화적</li>
                <li>• <strong>웹 스크래핑:</strong> 확실한 동작, 실제 브라우저처럼 동작</li>
                <li>• 테스트 결과에서 사용된 방식을 확인할 수 있습니다</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 로그인 필요</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 갤로그 방명록에 비밀글로 등록하려면 로그인이 필요합니다</li>
                <li>• 갤로그에 로그인한 후 세션 쿠키를 복사해서 설정해주세요</li>
                <li>• 403 Forbidden 오류가 발생하면 로그인 상태를 확인해주세요</li>
                <li>• 로그인 후 갤로그 방명록 페이지에서 쿠키를 복사하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
