import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// Steam ID를 URL에서 추출
function extractSteamId(claimedId: string): string | null {
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/)
  return match ? match[1] : null
}

// Steam OpenID 검증
async function validateSteamLogin(params: URLSearchParams): Promise<boolean> {
  const validationParams = new URLSearchParams(params)
  validationParams.set('openid.mode', 'check_authentication')
  
  try {
    const response = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: validationParams.toString(),
    })
    
    const text = await response.text()
    return text.includes('is_valid:true')
  } catch (error) {
    console.error('Steam validation error:', error)
    return false
  }
}

// Steam 사용자 정보 가져오기
async function getSteamUserInfo(steamId: string) {
  const apiKey = process.env.STEAM_WEB_API_KEY
  
  if (!apiKey) {
    console.error('STEAM_WEB_API_KEY not configured')
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
    )
    
    const data = await response.json()
    
    if (data.response?.players?.length > 0) {
      return data.response.players[0]
    }
    
    return null
  } catch (error) {
    console.error('Steam API error:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // OpenID 응답 검증
  const mode = searchParams.get('openid.mode')
  const claimedId = searchParams.get('openid.claimed_id')
  
  if (mode !== 'id_res' || !claimedId) {
    return NextResponse.redirect(new URL('/login?error=steam_auth_failed', request.url))
  }
  
  // Steam ID 추출
  const steamId = extractSteamId(claimedId)
  
  if (!steamId) {
    return NextResponse.redirect(new URL('/login?error=invalid_steam_id', request.url))
  }
  
  // Steam OpenID 검증
  const isValid = await validateSteamLogin(searchParams)
  
  if (!isValid) {
    return NextResponse.redirect(new URL('/login?error=steam_validation_failed', request.url))
  }
  
  // Steam 사용자 정보 가져오기
  const steamUser = await getSteamUserInfo(steamId)
  
  if (!steamUser) {
    return NextResponse.redirect(new URL('/login?error=steam_user_info_failed', request.url))
  }
  
  // Supabase에 사용자 생성 또는 로그인
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
  
  try {
    // Steam ID를 이메일 형식으로 변환 (Supabase는 이메일이 필수)
    const steamEmail = `steam_${steamId}@ghostx.site`
    
    // 기존 사용자 확인
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('steam_id', steamId)
      .single()
    
    if (existingProfile) {
      // 기존 사용자 - 로그인 처리
      // Supabase Auth에 Steam 사용자 연동
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: steamEmail,
        password: steamId, // Steam ID를 비밀번호로 사용 (보안상 문제 없음 - 외부 노출 안 됨)
      })
      
      if (signInError) {
        console.error('Sign in error:', signInError)
        // 로그인 실패 시 세션 생성 시도
        throw signInError
      }
    } else {
      // 새 사용자 - 회원가입
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: steamEmail,
        password: steamId,
        options: {
          data: {
            steam_id: steamId,
            steam_nickname: steamUser.personaname,
            steam_avatar: steamUser.avatarfull,
          },
          emailRedirectTo: undefined, // 이메일 확인 비활성화
        },
      })
      
      if (signUpError || !authData.user) {
        console.error('Sign up error:', signUpError)
        throw signUpError
      }
      
      // 프로필 생성
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: steamEmail,
        nickname: steamUser.personaname,
        steam_id: steamId,
        steam_avatar: steamUser.avatarfull,
        agreed_terms: true,
        agreed_privacy: true,
      })
    }
    
    // 로그인 성공 - 대시보드로 리다이렉트
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Supabase error:', error)
    return NextResponse.redirect(new URL('/login?error=database_error', request.url))
  }
}

