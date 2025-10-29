import { NextResponse } from 'next/server'

// Steam OpenID 로그인 시작
export async function GET(request: Request) {
  // 요청 URL에서 호스트 정보 추출
  const url = new URL(request.url)

  // 모바일 도메인(m.ghostx.site) 포함, 현재 요청의 호스트를 그대로 사용
  const baseUrl = `${url.protocol}//${url.host}`

  const returnUrl = `${baseUrl}/api/auth/steam/callback`
  
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': baseUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`
  
  return NextResponse.redirect(steamLoginUrl)
}

