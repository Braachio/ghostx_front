'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '../../utils/supabase'
import MobileHeader from '../../components/mobile/MobileHeader'

export default function MobileSettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    language: 'ko',
    autoRefresh: true,
    compactView: false
  })

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <MobileHeader user={user} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mobile-p-4">
          <h1 className="mobile-text-xl font-semibold mobile-mb-6">설정</h1>

          {/* 알림 설정 */}
          <div className="mobile-card mobile-mb-4">
            <h2 className="mobile-text-lg font-medium mobile-mb-4">알림</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mobile-text-base">푸시 알림</div>
                  <div className="mobile-text-sm text-slate-400">새 이벤트 알림 받기</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 표시 설정 */}
          <div className="mobile-card mobile-mb-4">
            <h2 className="mobile-text-lg font-medium mobile-mb-4">표시</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mobile-text-base">다크 모드</div>
                  <div className="mobile-text-sm text-slate-400">어두운 테마 사용</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="mobile-text-base">컴팩트 뷰</div>
                  <div className="mobile-text-sm text-slate-400">더 많은 정보를 한 화면에</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.compactView}
                    onChange={(e) => handleSettingChange('compactView', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 데이터 설정 */}
          <div className="mobile-card mobile-mb-4">
            <h2 className="mobile-text-lg font-medium mobile-mb-4">데이터</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mobile-text-base">자동 새로고침</div>
                  <div className="mobile-text-sm text-slate-400">이벤트 목록 자동 업데이트</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 언어 설정 */}
          <div className="mobile-card mobile-mb-4">
            <h2 className="mobile-text-lg font-medium mobile-mb-4">언어</h2>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="mobile-input"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* 계정 정보 */}
          {user && (
            <div className="mobile-card mobile-mb-4">
              <h2 className="mobile-text-lg font-medium mobile-mb-4">계정</h2>
              <div className="space-y-3">
                <div>
                  <div className="mobile-text-sm text-slate-400">이메일</div>
                  <div className="mobile-text-base">{user.email}</div>
                </div>
                <div>
                  <div className="mobile-text-sm text-slate-400">가입일</div>
                  <div className="mobile-text-base">
                    {new Date(user.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 버전 정보 */}
          <div className="mobile-card">
            <div className="text-center">
              <div className="mobile-text-sm text-slate-400 mobile-mb-1">Ghost-X Mobile</div>
              <div className="mobile-text-xs text-slate-500">v1.0.0</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
