'use client'

import { useEffect, useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

interface SectorRankingProps {
  track: string
  sector: number
}

interface SectorResult {
  user_id: string
  sector_time: number
}

export default function SectorRanking({ track, sector }: SectorRankingProps) {
  const [results, setResults] = useState<SectorResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createPagesBrowserClient<Database>()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('sector_results')
        .select('user_id, sector_time')
        .eq('track', track)
        .eq('sector_number', sector)
        .order('sector_time', { ascending: true })
        .limit(10)
        .returns<SectorResult[]>() // 타입 명시로 에러 방지

      if (error) {
        console.error('❌ Supabase error:', error.message)
        setError('데이터 불러오기 실패')
      } else {
        setResults(data ?? []) // null 방지
      }

      setLoading(false)
    }

    fetchData()
  }, [track, sector, supabase])

  if (loading) return <p>⏳ 데이터 불러오는 중...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">
        🏁 {track} - 섹터 {sector} 베스트 랩타임 TOP 10
      </h1>

      {results.length === 0 ? (
        <p>📭 아직 데이터가 없습니다.</p>
      ) : (
        <ol className="list-decimal list-inside text-sm space-y-1">
          {results.map((r, idx) => (
            <li key={`${r.user_id}-${idx}`}>
              {r.user_id} – <strong>{r.sector_time.toFixed(3)} 초</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
