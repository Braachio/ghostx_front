'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MyPostsPage() {
  const supabase = createClientComponentClient<Database>()
  const user = useUser()
  const [posts, setPosts] = useState<Multi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('multis')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) setPosts(data)
      setLoading(false)
    }

    fetchPosts()
  }, [user])

  const handleDelete = async (id: string) => {
    const ok = confirm('정말 삭제하시겠습니까?')
    if (!ok) return

    const { error } = await supabase.from('multis').delete().eq('id', id)
    if (!error) setPosts(posts.filter((p) => p.id !== id))
    else alert(`삭제 실패: ${error.message}`)
  }

  if (!user) return <p className="p-4">로그인이 필요합니다.</p>
  if (loading) return <p className="p-4">불러오는 중...</p>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">내 게시글 관리</h1>

      {posts.length === 0 && <p>작성한 게시글이 없습니다.</p>}

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="border p-4 rounded shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold">{post.title}</p>
                <p className="text-sm text-gray-500">{post.multi_time}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/multis/edit/${post.id}`}>
                  <button className="text-blue-600 hover:underline">수정</button>
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
