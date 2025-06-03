import { supabase } from './supabaseClient'

export type Multi = {
  id: number
  title: string
  game_category: string
  game: string
  multi_name: string
  multi_day: string[]
  multi_time: string
  is_open: boolean
  description: string
  created_at: string
  updated_at: string
}

type MultiUpdate = Partial<Omit<Multi, 'id' | 'created_at'>>

export async function getMultiById(id: string | number): Promise<Multi | null> {
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', Number(id))
    .single()

  if (error) {
    console.error('getMultiById 오류:', error.message)
    throw new Error('공지 조회 실패')
  }

  return data
}

export async function updateMulti(id: string | number, updates: MultiUpdate): Promise<Multi> {
  const { data, error } = await supabase
    .from('multis')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', Number(id))
    .select()
    .single()

  if (error) {
    console.error('updateMulti 오류:', error.message)
    throw new Error('공지 수정 실패')
  }

  return data
}

export async function deleteMulti(id: string | number): Promise<void> {
  const { error } = await supabase
    .from('multis')
    .delete()
    .eq('id', Number(id))

  if (error) {
    console.error('deleteMulti 오류:', error.message)
    throw new Error('공지 삭제 실패')
  }
}
