// app/create-post/page.tsx or CreatePostForm.tsx

'use client'

import { useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import { TIME_TRIAL_EVENT_TEMPLATE } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function CreatePostForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(TIME_TRIAL_EVENT_TEMPLATE)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const user = (await supabase.auth.getUser()).data.user
    const { error } = await supabase.from('posts').insert({
      title,
      content,
      author_id: user?.id ?? null,
    })

    setLoading(false)

    if (error) {
      alert('게시글 등록 실패: ' + error.message)
    } else {
      alert('등록 완료!')
      router.push('/community') // 등록 후 목록 페이지로 이동
    }
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '가져오기 실패')

      // 제목/본문 프리필
      if (data.title) setTitle(data.title)
      const lines: string[] = []
      if (data.game) lines.push(`게임: ${data.game}`)
      if (data.game_track) lines.push(`트랙: ${data.game_track}`)
      if (data.date_hint) lines.push(`날짜 힌트: ${data.date_hint}`)
      if (data.time_hint) lines.push(`시간 힌트: ${data.time_hint}`)
      if (data.link) lines.push(`원문: ${data.link}`)
      if (lines.length) setContent(prev => `${lines.join('\n')}\n\n${prev}`)
      alert('불러오기 완료. 내용을 확인하고 수정하세요.')
    } catch (e: unknown) {
      const error = e as Error
      alert(error?.message || '가져오기 실패')
    } finally {
      setImporting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* URL로 불러오기 */}
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="갤러리 글 URL을 붙여넣기"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          className="flex-1 border p-2 rounded"
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || !importUrl.trim()}
          className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {importing ? '불러오는 중...' : 'URL로 불러오기'}
        </button>
      </div>
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <textarea
        rows={20}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? '등록 중...' : '게시글 등록'}
      </button>
    </form>
  )
}
