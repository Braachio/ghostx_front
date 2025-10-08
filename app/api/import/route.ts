import { NextRequest, NextResponse } from 'next/server'

// 개선된 스크래퍼: 더 정확한 패턴 매칭과 다중 시도 로직

function extractByRegex(html: string, regex: RegExp): string | null {
  const m = html.match(regex)
  return m && m[1] ? m[1].trim().replace(/\s+/g, ' ') : null
}


function toTwo(n: number): string { return n < 10 ? `0${n}` : String(n) }

// ISO 주차 계산 (월요일 시작)
function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

const KOR_DAYS = ['일','월','화','수','목','금','토'] as const
type KorDay = typeof KOR_DAYS[number]

function parseKorDays(text: string): KorDay[] {
  const days = new Set<KorDay>()
  
  // 다양한 패턴으로 요일 찾기
  const patterns = [
    // 직접 매칭
    /([월화수목금토일])요?일?/g,
    // 괄호 안의 요일
    /\(([월화수목금토일])\)/g,
    // 요일 뒤에 숫자나 시간
    /([월화수목금토일])\s*[0-9]/g,
    // 요일 앞에 숫자
    /[0-9]\s*([월화수목금토일])/g,
    // 요일과 함께 나타나는 패턴
    /([월화수목금토일])\s*(요일|요|일)/g
  ]
  
  patterns.forEach(pattern => {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
      if (match[1]) days.add(match[1] as KorDay)
    }
  })
  
  return Array.from(days)
}

function parseTime(text: string): string | null {
  // 다양한 시간 패턴
  const patterns = [
    // 20:30, 20시30분, 20:30분
    /(\d{1,2})\s*[:시h]\s*(\d{1,2})\s*분?/i,
    // 20시, 20h
    /(\d{1,2})\s*[시h](?!\s*\d)/i,
    // PM/AM 패턴
    /(\d{1,2})\s*:\s*(\d{1,2})\s*(AM|PM)/i,
    // 오후 8시, 오전 10시
    /(오전|오후)\s*(\d{1,2})\s*시?/i,
    // 20 30 (공백으로 구분)
    /(\d{1,2})\s+(\d{1,2})(?!\s*\d)/i
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      let hh = parseInt(match[1] || match[2], 10)
      let mm = parseInt(match[2] || '0', 10)
      
      // PM 처리
      if (match[3] === 'PM' || match[1] === '오후') {
        if (hh < 12) hh += 12
      }
      // AM 처리
      if (match[3] === 'AM' || match[1] === '오전') {
        if (hh === 12) hh = 0
      }
      
      hh = Math.min(23, Math.max(0, hh))
      mm = Math.min(59, Math.max(0, mm))
      
      return `${toTwo(hh)}:${toTwo(mm)}`
    }
  }
  
  return null
}

function parseDate(text: string): { month: number; day: number } | null {
  // 다양한 날짜 패턴
  const patterns = [
    // 3월 5일, 03월 05일
    /(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
    // 3/5, 03/05, 3-5, 03-05
    /(\d{1,2})[\/.\-](\d{1,2})(?![\/.\-\d])/,
    // 3.5 (점으로 구분)
    /(\d{1,2})\.(\d{1,2})(?!\.)/,
    // (3/5), [3/5] 등
    /[\(\[\{](\d{1,2})[\/.\-](\d{1,2})[\)\]\}]/,
    // 3월5일 (공백 없음)
    /(\d{1,2})월(\d{1,2})일/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const month = parseInt(match[1], 10)
      const day = parseInt(match[2], 10)
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return { month, day }
      }
    }
  }
  
  return null
}

function resolveDate(month: number, day: number, time: string | null): Date {
  const now = new Date()
  const year = now.getFullYear()
  const base = new Date(year, month - 1, day)
  
  if (time) {
    const [hh, mm] = time.split(':').map((v) => parseInt(v,10))
    base.setHours(hh, mm, 0, 0)
  }
  
  // 이미 지난 날짜면 내년으로 롤오버
  if (base.getTime() < now.getTime() - 6 * 3600 * 1000) {
    base.setFullYear(year + 1)
  }
  
  return base
}

// 텍스트 정리 함수
function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url이 필요합니다.' }, { status: 400 })
    }

    // polite fetch (헤더 지정)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      return NextResponse.json({ error: `요청 실패: ${res.status} ${res.statusText}` }, { status: 502 })
    }
    
    const html = await res.text()
    const cleanHtml = cleanText(html)

    // 제목 추출 (다양한 방법 시도)
    let title = extractByRegex(cleanHtml, /<title[^>]*>([^<]{3,150})<\/title>/i)
    if (!title) {
      title = extractByRegex(cleanHtml, /<h1[^>]*>([^<]{3,150})<\/h1>/i)
    }
    if (!title) {
      title = extractByRegex(cleanHtml, /<h2[^>]*>([^<]{3,150})<\/h2>/i)
    }
    if (!title) {
      title = extractByRegex(cleanHtml, /og:title["\s]*content=["']([^"']{3,150})["']/i)
    }

    // 링크는 원본 url 유지
    const link = url

    // 날짜/시간/요일 고급 파싱
    const daysFound = parseKorDays(cleanHtml)
    const timeHint = parseTime(cleanHtml)
    const dateMD = parseDate(cleanHtml)
    
    let year: number | null = null
    let week: number | null = null
    let multi_day: KorDay[] = daysFound
    const multi_time: string | null = timeHint

    if (dateMD) {
      const dt = resolveDate(dateMD.month, dateMD.day, timeHint)
      const iso = getISOWeek(dt)
      year = iso.year
      week = iso.week
      if (multi_day.length === 0) multi_day = [KOR_DAYS[dt.getDay()]]
    }

    // 게임/트랙 키워드 매핑 (더 포괄적)
    const gameKeywords = {
      '컴페티치오네': [
        '컴페티치오네', 'acc', 'assetto corsa competizione', '아컴', '아세토코르사컴페티치오네',
        'competizione', '컴페티치오네', 'ACC', '컴페'
      ],
      '아세토코르사': [
        '아세토코르사', 'ac', 'assetto corsa', '아세토', '아세토코사',
        'assetto', 'corsa', '아세토', 'AC', '본편'
      ],
      '그란투리스모7': [
        '그란투리스모', 'gt7', 'gran turismo 7', '그란', 'GT7',
        'gran turismo', '그란투리스모7', 'turismo'
      ],
      '르망얼티밋': [
        '르망얼티밋', 'lm', 'le mans ultimate', '르망', '르망얼티밋',
        'le mans', 'ultimate', 'LMU', '르얼'
      ],
      'EA WRC': [
        'ea wrc', 'wrc', '랠리', 'rally', 'world rally championship',
        'EA WRC', 'world rally', '랠리챔피언십'
      ],
      '아이레이싱': [
        'iracing', '아이레이싱', 'i-racing', '아이 레이싱',
        'iRacing', 'IRACING', '아이레이싱', '아이싱'
      ],
      '알펙터2': [
        'rfactor2', 'rfactor 2', '알펙터', '알팩터', 'r-factor',
        'rFactor2', 'RFACTOR2', '알팩터2'
      ]
    }

    const trackKeywords = {
      'Monza': ['monza', '몬자', '몬자서킷', 'autodromo nazionale monza', 'MONZA', '몬자서킷'],
      'Spa': ['spa', '스파', '스파프랑코샹', 'spa-francorchamps', 'spa francorchamps', 'SPA', '스파프랑코샹'],
      'Nurburgring': ['nurburgring', '뉘르부르크링', '뉘르', 'nurburg', 'green hell', 'NURBURGRING', '뉘르부르크링'],
      'Imola': ['imola', '이몰라', 'autodromo enzo e dino ferrari', 'IMOLA', '이몰라서킷'],
      'Suzuka': ['suzuka', '스즈카', 'suzuka circuit', 'SUZUKA', '스즈카서킷'],
      'Silverstone': ['silverstone', '실버스톤', 'silverstone circuit', 'SILVERSTONE', '실버스톤서킷', '은돌'],
      'Red Bull Ring': ['red bull ring', '레드불링', 'red bull', 'spielberg', 'RED BULL RING', '레드불링'],
      'Zandvoort': ['zandvoort', '잔드보르트', 'circuit zandvoort', 'ZANDVOORT', '잔드보르트서킷'],
      'Laguna Seca': ['laguna seca', '라구나세카', 'laguna seca raceway', 'LAGUNA SECA', '라구나세카', '라구나'],
      'Brands Hatch': ['brands hatch', '브랜즈해치', 'brands hatch circuit', 'BRANDS HATCH', '브랜즈해치', '브해'],
      'Donington': ['donington', '도닝턴', 'donington park', 'DONINGTON', '도닝턴파크'],
      'Mount Panorama': ['mount panorama', '배서스트', 'bathurst', 'mt panorama', 'MOUNT PANORAMA', '배서스트서킷', '배서', '베써'],
      'Kyalami': ['kyalami', '킬라미', 'kyalami grand prix circuit', 'KYALAMI', '킬라미서킷', '키알리미', '캴리미']
    }

    let game = ''
    let game_track = ''
    const matchedGameKeywords: string[] = []
    const matchedTrackKeywords: string[] = []

    // 게임 매칭 (디버그 정보 포함)
    for (const [gameName, keywords] of Object.entries(gameKeywords)) {
      const matched = keywords.filter(keyword => {
        const regex = new RegExp(keyword, 'i')
        const found = regex.test(cleanHtml)
        if (found) matchedGameKeywords.push(keyword)
        return found
      })
      if (matched.length > 0) {
        game = gameName
        break
      }
    }

    // 트랙 매칭 (디버그 정보 포함)
    for (const [trackName, keywords] of Object.entries(trackKeywords)) {
      const matched = keywords.filter(keyword => {
        const regex = new RegExp(keyword, 'i')
        const found = regex.test(cleanHtml)
        if (found) matchedTrackKeywords.push(keyword)
        return found
      })
      if (matched.length > 0) {
        game_track = trackName
        break
      }
    }

    // 클래스 추출 (더 정확한 패턴)
    let multi_class = 'GT3' // 기본값
    const classPatterns = [
      { pattern: /gt3/gi, value: 'GT3' },
      { pattern: /gt4/gi, value: 'GT4' },
      { pattern: /formula/gi, value: 'Formula' },
      { pattern: /lmp1/gi, value: 'LMP1' },
      { pattern: /lmp2/gi, value: 'LMP2' },
      { pattern: /gte/gi, value: 'GTE' },
      { pattern: /gt 클래스/gi, value: 'GT' },
      { pattern: /포뮬러/gi, value: 'Formula' },
      { pattern: /프로토타입/gi, value: 'Prototype' }
    ]
    
    for (const { pattern, value } of classPatterns) {
      if (pattern.test(cleanHtml)) {
        multi_class = value
        break
      }
    }

    // HTML 샘플 추출 (디버그용)
    const htmlSample = cleanHtml.substring(0, 2000) // 처음 2000자만
    const htmlLength = cleanHtml.length

    return NextResponse.json({
      title: title || '',
      link,
      game,
      game_track,
      multi_class,
      date_hint: dateMD ? `${dateMD.month}월 ${dateMD.day}일` : '',
      time_hint: timeHint || '',
      multi_day,
      multi_time,
      year,
      week,
      debug: {
        url,
        html_length: htmlLength,
        html_sample: htmlSample,
        title_found: !!title,
        title_text: title || '',
        game_found: !!game,
        game_text: game || '',
        matched_game_keywords: matchedGameKeywords,
        track_found: !!game_track,
        track_text: game_track || '',
        matched_track_keywords: matchedTrackKeywords,
        class_found: multi_class !== 'GT3',
        class_text: multi_class,
        days_found: multi_day.length,
        days_text: multi_day,
        time_found: !!timeHint,
        time_text: timeHint || '',
        date_found: !!dateMD,
        date_text: dateMD ? `${dateMD.month}월 ${dateMD.day}일` : '',
        year_week: year && week ? `${year}년 ${week}주차` : ''
      }
    })
  } catch (e: unknown) {
    const error = e as Error
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: error?.message || '가져오기 실패',
      details: error?.stack 
    }, { status: 500 })
  }
}


