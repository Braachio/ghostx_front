'use client'

import { useState } from 'react'

interface DriverItem {
  custId: string
  name: string
  country?: string | null
  irating?: number | null
  licenseClass?: string | null
}

export default function IracingTestPage() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<DriverItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [percentile, setPercentile] = useState<any>(null)

  const search = async () => {
    setLoading(true)
    setError(null)
    setItems([])
    setProfile(null)
    setPercentile(null)
    try {
      const res = await fetch(`/api/iracing/driver/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || '검색 실패')
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '에러')
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (custId: string) => {
    setLoading(true)
    setError(null)
    setProfile(null)
    setPercentile(null)
    try {
      const pr = await fetch(`/api/iracing/driver/${custId}`)
      const pd = await pr.json()
      if (!pr.ok) throw new Error(pd?.error || '상세 실패')
      setProfile(pd)
      const val = pd?.irating ?? 0
      const pct = await fetch(`/api/iracing/percentile?metric=irating&value=${val}&country=${pd?.country || ''}`)
      const pctd = await pct.json()
      if (pct.ok) setPercentile(pctd)
    } catch (e) {
      setError(e instanceof Error ? e.message : '에러')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">iRacing 테스트</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 검색"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
          />
          <button onClick={search} className="px-4 py-2 bg-blue-600 rounded">검색</button>
        </div>
        {loading && <div>로딩...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((it) => (
              <button key={it.custId} onClick={() => loadDetail(it.custId)} className="w-full text-left bg-gray-800 border border-gray-700 rounded p-3 hover:bg-gray-750">
                <div className="font-semibold">{it.name}</div>
                <div className="text-sm text-gray-400">custId: {it.custId} • {it.country || '-'} • iR {it.irating ?? '-'} • L {it.licenseClass ?? '-'}</div>
              </button>
            ))}
          </div>
        )}
        {profile && (
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="font-bold mb-2">프로필</div>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(profile, null, 2)}</pre>
          </div>
        )}
        {percentile && (
          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="font-bold mb-2">퍼센타일</div>
            <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(percentile, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}


