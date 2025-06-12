// lib/fetchSheetData.ts
import { google } from 'googleapis'

const SHEET_ID = '1D5eXqqnHDODAeEjyVZf5INmLbG63yaMtufjmhd08R54'
const RANGE = '세부 일정표!B71:I'

export async function fetchSheetData() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })

  const client = await auth.getClient()
  const sheets = google.sheets({ version: 'v4', auth: client })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  if (!rows || rows.length === 0) return []

  return rows.map(([일자, 요일, 시간, 게임, 서킷, 클래스, 레이스, 공지]) => ({
    date: 일자,
    multiDay: 요일,
    multiTime: 시간,
    game: 게임,
    gameTrack: 서킷,
    multiClass: 클래스,
    multiRace: 레이스,
    description: 공지,
  }))
}
