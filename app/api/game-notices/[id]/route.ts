// app/api/game-notices/[id]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  const { data, error } = await supabase
    .from('game_notices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  return new Response(JSON.stringify(data), { status: 200 })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { title, content } = await req.json()

  const { error } = await supabase
    .from('game_notices')
    .update({ title, content })
    .eq('id', id)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  const { error } = await supabase
    .from('game_notices')
    .delete()
    .eq('id', id)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}
