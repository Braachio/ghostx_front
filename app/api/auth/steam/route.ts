import { NextResponse } from 'next/server'

// Steam OpenID 로그인 시작
export async function GET(request: Request) {
  // 요청 URL에서 호스트 정보 추출
  const url = new URL(request.url)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  
  // localhost인 경우 localhost URL 사용, 그렇지 않으면 환경변수 또는 기본값 사용
  const baseUrl = isLocalhost 
    ? `${url.protocol}//${url.host}` 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostx.site')
  
  const returnUrl = `${baseUrl}/api/auth/steam/callback`
  
  console.log('Steam login configuration:', {
    isLocalhost,
    baseUrl,
    returnUrl,
    hostname: url.hostname,
    protocol: url.protocol
  })
  
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

