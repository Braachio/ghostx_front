import express, {Request, Response} from 'express'
import cron from 'node-cron'
import fetchSheetData from './sheetFetcher'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 매일 오전 6시에 실행되는 크론 스케줄러
cron.schedule('0 6 * * *', async () => {
  console.log('⏰ 스케줄러 실행 중...')
  const rows = await fetchSheetData()

  // 여기에 Supabase, DB 저장, 중복 방지 로직 등 연결
  console.log('✅ 불러온 데이터:', rows)
})

// 수동 트리거용
app.get('/manual-fetch', async (req: Request, res: Response) => {
  try {
    const rows = await fetchSheetData()
    res.json({ success: true, data: rows })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    res.status(500).json({ success: false, error: '데이터 불러오기 실패' })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중`)
})
