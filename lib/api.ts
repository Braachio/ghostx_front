// api 호출 함수 (예: 멀티(공지) 등록)
import { supabase } from '@/lib/supabaseClient'

async function createMulti(newMulti: { title: string; content: string }) {
  // 현재 로그인 세션에서 access_token 가져오기
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) {
    alert('로그인 후 이용해주세요')
    return
  }
  const access_token = session.access_token

  // API 호출
  const res = await fetch('/api/multis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`,  // 토큰 헤더에 넣기
    },
    body: JSON.stringify(newMulti),
  })

  const result = await res.json()
  if (!res.ok) {
    alert('등록 실패: ' + (result.error || '알 수 없는 오류'))
    return null
  }
  alert('등록 성공!')
  return result
}
