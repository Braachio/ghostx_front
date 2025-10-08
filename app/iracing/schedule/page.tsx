'use client'

import { useState } from 'react'

type Row = { week: number; date: string; track: string; category?: string; series?: string; class?: string }

export default function IRacingSchedulePage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [series, setSeries] = useState('')
  const [pages, setPages] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState<string>('all')

  const submit = async () => {
    if (!file && !url.trim()) return
    setLoading(true)
    try {
      const form = new FormData()
      if (file) form.append('file', file)
      if (url.trim()) form.append('url', url.trim())
      const res = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'}/api/iracing/schedule/parse`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || '파싱 실패')
      setSeries(data.series || '')
      setPages(data.pages || 0)
      setRows(Array.isArray(data.rows) ? data.rows : [])
    } catch (e: unknown) {
      const err = e as Error
      alert(err.message || '요청 실패')
    } finally {
      setLoading(false)
    }
  }

  // 필터링된 데이터
  const filteredRows = rows.filter(row => {
    if (selectedCategory !== 'all' && row.category !== selectedCategory) return false
    if (selectedWeek !== 'all' && row.week.toString() !== selectedWeek) return false
    return true
  })

  // 카테고리 목록
  const categories = Array.from(new Set(rows.map(r => r.category).filter(Boolean)))
  const weeks = Array.from(new Set(rows.map(r => r.week))).sort((a, b) => a - b)

  // 카테고리별 그룹핑
  const groupedRows = filteredRows.reduce((acc, row) => {
    const key = row.category || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {} as Record<string, Row[]>)

  return (
    <div className="bg-black min-h-screen text-white px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">iRacing 시즌 PDF 파서</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-900 rounded border border-gray-700">
            <label className="block text-sm text-gray-300 mb-2">PDF 업로드</label>
            <input type="file" accept="application/pdf" onChange={(e)=>setFile(e.target.files?.[0] || null)} className="w-full text-gray-200" />
          </div>
          <div className="p-4 bg-gray-900 rounded border border-gray-700 md:col-span-2">
            <label className="block text-sm text-gray-300 mb-2">혹은 URL</label>
            <div className="flex gap-2">
              <input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://example.com/schedule.pdf" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded" />
              <button onClick={submit} disabled={loading} className="px-4 py-2 bg-cyan-600 rounded disabled:opacity-50">{loading? '파싱 중...' : '파싱'}</button>
            </div>
          </div>
        </div>

        {rows.length > 0 && (
          <div className="bg-gray-900 rounded border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">{series || 'Series'}</div>
                <div className="text-sm text-gray-400">페이지: {pages}, 항목: {rows.length} (필터링: {filteredRows.length})</div>
              </div>
            </div>

            {/* 필터 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-300 mb-2">카테고리</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="all">전체</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">주차</label>
                <select 
                  value={selectedWeek} 
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="all">전체</option>
                  {weeks.map(week => (
                    <option key={week} value={week.toString()}>Week {week}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 카테고리별 그룹핑된 테이블 */}
            <div className="space-y-6">
              {Object.entries(groupedRows).map(([category, categoryRows]) => (
                <div key={category} className="bg-gray-800 rounded border border-gray-600 p-4">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-400">{category}</h3>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-300">
                          <th className="py-2 pr-4">Week</th>
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Track</th>
                          <th className="py-2 pr-4">Series</th>
                          <th className="py-2 pr-4">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryRows.map((r, i) => (
                          <tr key={i} className="border-t border-gray-700">
                            <td className="py-2 pr-4">{r.week}</td>
                            <td className="py-2 pr-4">{r.date}</td>
                            <td className="py-2 pr-4">{r.track}</td>
                            <td className="py-2 pr-4">{r.series || '-'}</td>
                            <td className="py-2 pr-4">{r.class || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


