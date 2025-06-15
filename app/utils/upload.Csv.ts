import { supabase } from '@/lib/supabaseClient'

export async function uploadCsv(file: File, userId: string) {
  const filePath = `${userId}/${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 공개 URL 반환
  const { publicUrl } = supabase.storage.from('files').getPublicUrl(filePath).data
  return publicUrl
}
