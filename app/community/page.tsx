'use client'

import { useEffect, useState } from 'react'
import { supabase } from 'lib/supabaseClient'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  created_at: string
}

export default function PostListPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('게시글 불러오기 실패:', error.message)
      } else {
        setPosts(data || [])
      }
      setLoading(false)
    }

    fetchPosts()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">💬 커뮤니티</h1>
        <Link href="/">
          <button className="px-4 py-2 bg-gray-500 text-white rounded">홈으로</button>
        </Link>
      </div>

      {loading ? (
        <p>로딩 중...</p>
      ) : posts.length === 0 ? (
        <p>게시글이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/community/${post.id}`}>
                <div className="border p-3 rounded hover:bg-gray-100">
                  <h2 className="font-semibold text-lg">{post.title}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
