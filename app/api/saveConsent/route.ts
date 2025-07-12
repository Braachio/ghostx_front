import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient({ req })
  const { data: { user } } = await supabase.auth.getUser()
  const { consent } = await req.json()

  if (!user) return new Response('Unauthorized', { status: 401 })

  await supabase.from('profiles').update({ cookie_consent: consent }).eq('id', user.id)
  return new Response('OK')
}
