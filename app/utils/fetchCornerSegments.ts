import { supabase } from 'lib/supabaseClient'

export async function fetchCornerSegments(track: string) {
  const { data, error } = await supabase
    .from('corner_segments')
    .select('*')
    .eq('track', track.toLowerCase())
    .order('segment_index', { ascending: true });

  if (error) {
    console.error('❌ 코너 구간 불러오기 실패:', error);
    return [];
  }

  return data;
}
