'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

interface MultiCsvRow {
  일자: string
  요일: string
  시간: string
  게임: string
  서킷: string
  클래스: string
  레이스: string
  공지: string
}

// ✅ 게임 이름 정규화 함수
function normalizeGameName(game: string): string {
  return game
    .replace(/\s+/g, '') // 공백 제거
    .replace(/아세토코르사|아세토\s?코르사/, '아세토코르사')
    .replace(/아세토컴페|아세토\s?(컴페|컴페티치오네)/, '컴페티치오네')
    .replace(/그란투리스모7|그란\s?투리스모\s?7/, '그란투리스모7')
    .replace(/르망얼티밋|르망\s?얼티밋/, '르망얼티밋')
}

export default function CsvUploadPage() {
  const supabase = createClientComponentClient<Database>()
  const [isAdmin, setIsAdmin] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('CSV 업로드 페이지 - 사용자 확인:', { user: user?.email, userId: user?.id })
      
      if (!user) {
        console.log('사용자가 로그인되지 않음')
        return
      }

      // profiles 테이블에서 사용자 역할 확인
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      console.log('프로필 조회 결과:', { profile, error })

      if (profile && (profile.role === 'admin' || profile.role === 'event_manager')) {
        console.log('관리자 권한 확인됨:', profile.role)
        setIsAdmin(true)
      } else {
        console.log('관리자 권한 없음:', profile?.role)
      }
    }
    checkAdmin()
  }, [supabase])

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as MultiCsvRow[]
        let successCount = 0
        let duplicateCount = 0
        let failCount = 0

        for (const row of rows) {
          const link = row['공지']?.trim() || ''
          const isValidLink = /^https?:\/\/.+/.test(link)

          if (!isValidLink) {
            console.warn(`❌ 무효한 링크 건너뜀: ${link}`)
            continue
          }

          // ✅ 게임 이름 정규화
          const normalizedRow = {
            ...row,
            게임: normalizeGameName(row.게임),
          }

          const res = await fetch('/api/auto-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(normalizedRow),
          })

          const result = await res.json()

          if (res.ok) {
            if (result.message === '중복 건너뜀') {
              duplicateCount++
            } else {
              successCount++
            }
          } else {
            failCount++
          }
        }

        setUploading(false)
        setMessage(
          `✅ ${successCount}개 등록 완료\n🟡 ${duplicateCount}개 중복\n❌ ${failCount}개 실패`
        )
      },
    })
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-gray-500">
        이 페이지는 관리자만 접근할 수 있습니다.
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📥 CSV로 공지 자동 등록</h1>
      <input
        type="file"
        accept=".csv"
        onChange={handleCsvUpload}
        className="mb-4"
      />
      {uploading && <p className="text-blue-600">업로드 중...</p>}
      {message && <p className="text-green-600 mt-2 whitespace-pre-line">{message}</p>}
    </div>
  )
}
