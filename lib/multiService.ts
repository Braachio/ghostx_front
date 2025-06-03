import { supabase } from './supabaseClient'

export async function getMultiById(id: number) {
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateMulti(id: number, updateData: any) {
  const { data, error } = await supabase
    .from('multis')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteMulti(id: number) {
  const { error } = await supabase
    .from('multis')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
