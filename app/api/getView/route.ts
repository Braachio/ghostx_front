import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 보안 주의
)

export async function GET() {
  const { data, error } = await supabase
    .from('page_views')
    .select('view_count')
    .eq('page_name', 'home')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ view_count: data.view_count })
}
