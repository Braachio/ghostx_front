// components/CookieSettingsButton.tsx
'use client'
import { useState } from 'react'
import Cookies from 'js-cookie'

export default function CookieSettingsButton() {
  const [visible, setVisible] = useState(false)
  const current = Cookies.get('cookie_consent')

  const updateConsent = (value: 'essential' | 'all') => {
    Cookies.set('cookie_consent', value, { expires: 365 })
    setVisible(false)
    window.location.reload()
  }

  return (
    <div className="mt-8 flex justify-end">
      <div className="max-w-xs w-full sm:w-auto text-sm text-gray-500">
        <button
          onClick={() => setVisible(!visible)}
          className="underline"
        >
          내 쿠키 설정 보기/수정
        </button>

        {visible && (
          <div className="mt-2 px-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
            <p>
              현재 설정: <strong>{current ?? '설정되지 않음'}</strong>
            </p>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => updateConsent('essential')}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
              >
                필수만 허용
              </button>
              <button
                onClick={() => updateConsent('all')}
                className="px-3 py-1 rounded bg-blue-600 text-white"
              >
                전체 허용
              </button>
            </div>
          </div>
        )}
      </div>
    </div>


  )
}
