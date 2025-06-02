import { createClient } from '@/lib/supabase' // 또는 경로에 맞게 조정

// 타입 정의 (예시, 필요에 따라 조정)
interface Multi {
  id: number
  title: string
  game: string
  multi_name: string
  multi_day: string[]
  multi_time: string
  is_open: boolean
  description: string
  created_at?: string
}

// 공지 하나 가져오기
export async function getMultiById(id: number): Promise<Multi | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getMultiById error:', error)
    throw new Error('공지 조회 실패')
  }

  return data
}

// 공지 수정
export async function updateMulti(id: number, updateData: Partial<Multi>): Promise<Multi> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('multis')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateMulti error:', error)
    throw new Error('공지 수정 실패')
  }

  return data
}

// 공지 삭제
export async function deleteMulti(id: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('multis')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteMulti error:', error)
    throw new Error('공지 삭제 실패')
  }
}
