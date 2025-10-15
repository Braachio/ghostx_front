import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 })
    }

    // URL 유효성 검사
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: '유효하지 않은 URL입니다.' }, { status: 400 })
    }

    // 웹페이지에서 메타데이터 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: '웹페이지를 가져올 수 없습니다.' }, { status: 400 })
    }

    const html = await response.text()
    
    // 메타데이터 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Open Graph 메타데이터 추출
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : ''

    const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const ogDescription = ogDescriptionMatch ? ogDescriptionMatch[1].trim() : ''

    // 일반 메타 description 추출
    const metaDescriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    const metaDescription = metaDescriptionMatch ? metaDescriptionMatch[1].trim() : ''

    // DC인사이드 갤러리 특별 처리
    let finalTitle = ogTitle || title
    let finalDescription = ogDescription || metaDescription

    if (url.includes('gall.dcinside.com')) {
      // DC인사이드 갤러리 제목 정리
      finalTitle = finalTitle.replace(/^\[.*?\]\s*/, '').trim()
      
      // DC인사이드 갤러리 설명이 없으면 기본 설명 생성
      if (!finalDescription) {
        finalDescription = 'DC인사이드 갤러리에서 가져온 게시글입니다.'
      }
    }

    return NextResponse.json({
      title: finalTitle,
      description: finalDescription,
      url: url
    })

  } catch (error) {
    console.error('북마크 처리 오류:', error)
    return NextResponse.json({ error: '북마크 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
