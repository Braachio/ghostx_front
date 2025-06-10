import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import keys from 'service-account.json' // 상대경로 확인

const SHEET_ID = '1D5eXqqnHDODAeEjyVZf5INmLbG63yaMtufjmhd08R54'
const RANGE = '세부 일정표!B71:I'

export default async function fetchSheetData() {
  const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const client = (await auth.getClient()) as JWT
  const sheets = google.sheets({ version: 'v4', auth: client })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  if (!rows || rows.length === 0) return []

  return rows.map(([일자, 요일, 시간, 게임, 서킷, 클래스, 레이스, 공지]) => ({
    date: 일자,
    day: 요일,
    time: 시간,
    game: 게임,
    track: 서킷,
    class: 클래스,
    race: 레이스,
    notice: 공지,
  }))
}
