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
    <header className="mobile-header bg-gradient-to-r from-slate-900 to-slate-800 shadow-lg">
      <div className="flex items-center justify-between mobile-px-4 mobile-py-4">
        {/* 로고 */}
        <Link href="/mobile" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-xl">👻</span>
          </div>
          <div>
            <span className="mobile-text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Ghost-X
            </span>
            <div className="mobile-text-xs text-slate-400">모바일</div>
          </div>
        </Link>

        {/* 사용자 메뉴 */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 mobile-px-4 mobile-py-2 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50 touch-button hover:bg-slate-600/50 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm font-bold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="mobile-text-sm font-medium text-slate-200">
                    {user.email?.split('@')[0]}
                  </div>
                  <div className="mobile-text-xs text-slate-400">온라인</div>
                </div>
                <svg className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mobile-mt-2 w-64 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-xl z-50">
                  <div className="mobile-p-4">
                    <div className="flex items-center space-x-3 mobile-mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="mobile-text-sm font-medium text-slate-200">
                          {user.email?.split('@')[0]}
                        </div>
                        <div className="mobile-text-xs text-slate-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link 
                        href="/profile" 
                        className="flex items-center space-x-3 mobile-px-3 mobile-py-3 hover:bg-slate-700/50 rounded-lg mobile-text-sm transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>프로필</span>
                      </Link>
                      <Link 
                        href="/mobile/settings" 
                        className="flex items-center space-x-3 mobile-px-3 mobile-py-3 hover:bg-slate-700/50 rounded-lg mobile-text-sm transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>설정</span>
                      </Link>
                      <button 
                        className="flex items-center space-x-3 w-full text-left mobile-px-3 mobile-py-3 hover:bg-red-500/20 rounded-lg mobile-text-sm transition-colors text-red-400"
                        onClick={() => {
                          // 로그아웃 로직
                          setShowMenu(false)
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>로그아웃</span>
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
                className="mobile-px-4 mobile-py-2 bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/50 mobile-text-sm touch-button hover:bg-slate-600/50 transition-all"
              >
                로그인
              </Link>
              <Link 
                href="/signup" 
                className="mobile-px-4 mobile-py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl mobile-text-sm touch-button hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
