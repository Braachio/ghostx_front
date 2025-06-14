import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  if (!id || id === 'undefined') {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('game_notices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 200 })
}
