// lib/googleSheets.ts
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'
import credentials from './google-credentials.json' // 서비스 계정 키

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const SHEET_ID = '1D5eXqqnHDODAeEjyVZf5INmLbG63yaMtufjmhd08R54'
const RANGE = '세부 일정표!B2:J' // A:일자, B:요일, C:시간, ... H:공지

const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
})

export async function fetchSheetData() {
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  })

  const rows = res.data.values
  if (!rows || rows.length === 0) return []

  return rows.map((row) => ({
    date: row[0],
    day: row[1],
    time: row[2],
    game: row[3],
    track: row[4],
    class: row[5],
    race: row[6],
    notice: row[7],
  }))
}
