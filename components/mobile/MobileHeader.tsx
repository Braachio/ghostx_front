'use client'

import { User } from '@supabase/supabase-js'
import { useState } from 'react'
import Link from 'next/link'

interface MobileHeaderProps {
  user: User | null
}

export default function MobileHeader({ user }: MobileHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="mobile-header">
      <div className="flex items-center justify-between mobile-px-4 mobile-py-3">
        {/* 로고 */}
        <Link href="/mobile" className="flex items-center space-x-2">
          <span className="text-2xl">👻</span>
          <span className="mobile-text-lg">Ghost-X</span>
        </Link>

        {/* 사용자 메뉴 */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 mobile-px-3 mobile-py-2 bg-slate-700 rounded-lg touch-button"
              >
                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="mobile-text-sm hidden sm:block">
                  {user.email?.split('@')[0]}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="mobile-dropdown mobile-mt-2">
                  <div className="mobile-p-3">
                    <div className="mobile-text-sm text-slate-400 mobile-mb-2">
                      {user.email}
                    </div>
                    <div className="space-y-1">
                      <Link 
                        href="/profile" 
                        className="block mobile-px-3 mobile-py-2 hover:bg-slate-700 rounded-lg mobile-text-sm"
                        onClick={() => setShowMenu(false)}
                      >
                        프로필
                      </Link>
                      <Link 
                        href="/mobile/settings" 
                        className="block mobile-px-3 mobile-py-2 hover:bg-slate-700 rounded-lg mobile-text-sm"
                        onClick={() => setShowMenu(false)}
                      >
                        설정
                      </Link>
                      <button 
                        className="block w-full text-left mobile-px-3 mobile-py-2 hover:bg-slate-700 rounded-lg mobile-text-sm"
                        onClick={() => {
                          // 로그아웃 로직
                          setShowMenu(false)
                        }}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex space-x-2">
              <Link 
                href="/login" 
                className="mobile-px-3 mobile-py-2 bg-slate-700 rounded-lg mobile-text-sm touch-button"
              >
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="mobile-px-3 mobile-py-2 bg-cyan-600 rounded-lg mobile-text-sm touch-button"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => {/* 탭 변경 로직 */}}
          className="mobile-tab active"
        >
          📅 캘린더
        </button>
        <button
          onClick={() => {/* 탭 변경 로직 */}}
          className="mobile-tab"
        >
          📋 이벤트
        </button>
      </div>
    </header>
  )
}
