// lib/auth.ts
import { supabaseAdmin } from './supabaseAdminClient'

export async function checkAdminAuth(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return false

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !profile.role) return false

  return profile.role === 'admin'
}
