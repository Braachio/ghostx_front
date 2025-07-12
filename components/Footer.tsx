// components/Footer.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-400 text-sm px-4 py-8 mt-12">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* 상단: 로고 + 언어 + SNS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-300 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-2">
            <Image src="/logo/ghost-x-symbol.svg" alt="Ghost-X" width={24} height={24} className="dark:invert" />
            <span className="font-semibold text-gray-900 dark:text-white">Ghost-X</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">대한민국 - 한국어 | KRW</div>
          <div className="flex gap-3 text-lg">
            <a href="#" aria-label="Facebook" className="hover:text-blue-500">📘</a>
            <a href="#" aria-label="YouTube" className="hover:text-red-500">▶️</a>
          </div>
        </div>

        {/* 중간: 저작권 및 링크 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            © 2025 Ghost-X. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
            <Link href="/terms" className="hover:underline">이용약관</Link>
            <Link href="/privacy" className="hover:underline">개인정보 처리방침</Link>
            <Link href="/legal" className="hover:underline">법적 고지</Link>
            <Link href="/cookies" className="hover:underline">쿠키 설정</Link>
          </div>
        </div>

        {/* 하단 고지 */}
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 leading-relaxed">
          본 웹사이트 사용 시 Ghost-X의 서비스 약관 및 정책에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </footer>
  )
}
