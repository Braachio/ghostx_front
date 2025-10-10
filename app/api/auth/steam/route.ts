import { NextRequest, NextResponse } from 'next/server'

// Steam OpenID 로그인 시작
export async function GET(request: NextRequest) {
  const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostx.site'}/api/auth/steam/callback`
  
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostx.site',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`
  
  return NextResponse.redirect(steamLoginUrl)
}

