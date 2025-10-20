// ✅ 클라이언트 환경 전용 supabase 인스턴스 (SSR 필요 없음)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. 기본값을 사용합니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { createClient }
