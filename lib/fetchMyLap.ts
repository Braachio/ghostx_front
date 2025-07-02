// lib/fetchMyLaps.ts (예: 분리된 유틸 파일)
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

const supabase = createPagesBrowserClient<Database>()

export const fetchMyLaps = async (userId: string) => {
  const { data, error } = await supabase
    .from('lap_meta')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('🚨 랩 데이터 조회 실패:', error)
    return []
  }

  return data
}
