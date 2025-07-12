'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Image from 'next/image'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'

interface MeResponse {
  id: string
  nickname: string
}

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [views, setViews] = useState<number | null>(null)
  const supabase = useSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  useEffect(() => {
    const loadUserAndViews = async () => {
      try {
        await fetch('/api/incrementView', { method: 'POST' })

        const viewRes = await fetch('/api/getView')
        if (viewRes.ok) {
          const { view_count } = await viewRes.json()
          setViews(view_count)
        }

        const meRes = await fetch('/api/me')
        if (meRes.ok) {
          const { user } = await meRes.json()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      }
    }

    loadUserAndViews()
  }, [])

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* 헤더 - 브랜드 로고 & 로그인 상태 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-gray-300 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Image src="/logo/ghost-x-symbol.svg" alt="logo" width={32} height={32} className="dark:invert" />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight">Ghost-X</h1>
          </div>

          <div className="w-full sm:w-auto">
            {user ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <span className="text-sm text-green-600 dark:text-green-400">
                  👤 {user.nickname}님 환영합니다
                </span>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
                >
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm rounded-md border border-red-400 text-red-600 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-gray-700 transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-center"
                >
                  회원가입
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition text-center"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 메뉴 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/multis">
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow hover:shadow-lg transition cursor-pointer">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">🗓️ 멀티 캘린더</h2>
              {/* <p className="text-sm text-gray-600 dark:text-gray-300">
                커뮤니티에서 올라온 심레이싱 이벤트 일정을 확인하고 미리 계획해보세요.
              </p> */}
            </div>
          </Link>

          <Link href="/upload-id">
            <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow hover:shadow-lg transition cursor-pointer">
              <div className="flex items-center gap-2">
                <img src="/logo/Logo-acc.png" alt="ACC-Logo" className="w-8 h-8 mb-2" />
                <span className="text-lg sm:text-xl font-semibold mb-2">ACC 주행 분석</span>
              </div>
              {/* <p className="text-sm text-gray-600 dark:text-gray-300">
                MoTeC CSV 파일을 업로드하면 자동으로 랩 데이터를 분석해드립니다.
              </p> */}
            </div>
          </Link>
        </div>

        {/* About Section */}
        {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">📘 서비스 소개</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            본 웹서비스는 심레이싱 유저들을 위한 데이터 분석 도구입니다.
            <br />
            주행 데이터를 업로드하면, <strong>자동으로 분석</strong>되어 주행 습관, 브레이킹 포인트, 코너링 스타일 등을 시각화된 리포트로 확인할 수 있습니다.
            <br />
            이를 통해 <span className="text-blue-600 dark:text-blue-400 font-semibold">자신의 실력 향상</span>은 물론, <span className="text-blue-600 dark:text-blue-400 font-semibold">커뮤니티에서의 경쟁력</span>도 키울 수 있습니다.
          </p>
        </div> */}

        {/* FAQ Section */}
        {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-2">❓ 자주 묻는 질문 (FAQ)</h2>
          <ul className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <p className="font-semibold">Q. 어떤 게임에서 추출한 데이터를 지원하나요?</p>
              <p>A. 현재는 MoTeC에서 내보낸 CSV 포맷만 지원하며, 아세토코르사 컴페티치오네(MoTeC 연동 가능 게임)에 호환됩니다.</p>
            </li>
            <li>
              <p className="font-semibold">Q. 데이터를 업로드하면 어디에 저장되나요?</p>
              <p>A. 분석 결과는 사용자 고유 ID와 함께 Supabase에 안전하게 저장됩니다.</p>
            </li>
            <li>
              <p className="font-semibold">Q. 분석 결과는 어떻게 활용하나요?</p>
              <p>A. 분석 리포트를 통해 개인 훈련 계획을 세우거나, 리그/대회 준비에 참고할 수 있습니다.</p>
            </li>
          </ul>
        </div> */}

        {/* Feedback Form Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">📩 문의 및 피드백</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            서비스 개선을 위한 의견이나 궁금한 점이 있다면 아래에 남겨주세요.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const email = form.email.value
              const message = form.message.value

              const res = await fetch('/api/submitFeedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, message }),
              })

              if (res.ok) {
                alert('✅ 피드백이 전송되었습니다. 감사합니다!')
                form.reset()
              } else {
                alert('❌ 전송 실패. 다시 시도해주세요.')
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              name="email"
              placeholder="이메일 (선택)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-sm"
            />
            <textarea
              name="message"
              required
              placeholder="문의 또는 피드백 내용을 입력해주세요"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-sm"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              보내기
            </button>
          </form>
        </div>
        {/* 방문 수 */}
        <div className="text-left text-xs text-gray-500 dark:text-gray-400">
          누적 방문: {views !== null ? views.toLocaleString() : '...'}회
        </div>  

      </div>

      <Footer />
      {/* 쿠키 설정 */}
      <CookieConsentBanner />      
    </main>
  )
}

