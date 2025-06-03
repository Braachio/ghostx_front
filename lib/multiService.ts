import { supabase } from './supabaseClient'

type Multi = {
  id: number
  title: string
  content: string
  created_at: string
  updated_at: string
  // 필요에 따라 다른 필드들도 추가하세요
}

type MultiUpdate = Partial<Omit<Multi, 'id' | 'created_at'>>

export async function getMultiById(id: number): Promise<Multi | null> {
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getMultiById 오류:', error.message)
    throw new Error('공지 조회 실패')
  }

  return data
}

export async function updateMulti(id: number, updates: MultiUpdate): Promise<Multi> {
  const { data, error } = await supabase
    .from('multis')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateMulti 오류:', error.message)
    throw new Error('공지 수정 실패')
  }

  return data
}

export async function deleteMulti(id: number): Promise<void> {
  const { error } = await supabase
    .from('multis')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteMulti 오류:', error.message)
    throw new Error('공지 삭제 실패')
  }
}
