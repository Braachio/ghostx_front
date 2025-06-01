// app/create-post/page.tsx or components/CreatePostForm.tsx

'use client'

import { useState } from 'react'
import { TIME_TRIAL_EVENT_TEMPLATE } from '@/lib/constants'

export default function CreatePostForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(TIME_TRIAL_EVENT_TEMPLATE) // 템플릿이 기본값으로 삽입됨

  const handleSubmit = async () => {
    // Supabase INSERT 요청 등
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded"
      />
      <textarea
        rows={20}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        게시글 등록
      </button>
    </form>
  )
}
