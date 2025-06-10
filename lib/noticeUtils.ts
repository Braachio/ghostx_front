import { supabase } from './supabaseClient'

interface SheetRow {
  date: string
  day: string
  time: string
  game: string
  track: string
  class: string
  race: string
  notice: string
}

export async function createNoticeIfNotExists(row: SheetRow) {
  const { data: existing } = await supabase
    .from('notice')
    .select('*')
    .eq('title', row.notice)
    .eq('game', row.game)
    .eq('game_track', row.track)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await supabase.from('notice').insert([
      {
        title: row.notice,
        game: row.game,
        game_track: row.track,
        multi_class: row.class,
        multi_race: row.race,
        multi_day: [row.day],
        multi_time: row.time,
        year: new Date(row.date).getFullYear(),
        week: getKoreanWeek(new Date(row.date)),
      },
    ])

    if (insertError) {
      console.error('공지 삽입 오류:', insertError)
    }
  }
}

function getKoreanWeek(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = (date.getTime() - start.getTime()) / 86400000
  const startDay = start.getDay() === 0 ? 7 : start.getDay()
  const offset = startDay <= 1 ? 0 : 7 - (startDay - 1)
  return Math.ceil((diff + offset) / 7)
}
