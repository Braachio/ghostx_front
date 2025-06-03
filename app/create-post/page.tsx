// app/create-post/page.tsx or CreatePostForm.tsx

'use client'

import { useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import { TIME_TRIAL_EVENT_TEMPLATE } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function CreatePostForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(TIME_TRIAL_EVENT_TEMPLATE)
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
