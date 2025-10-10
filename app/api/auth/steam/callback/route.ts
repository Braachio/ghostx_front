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
  
  try {
    // OpenID 응답 검증
    const mode = searchParams.get('openid.mode')
    const claimedId = searchParams.get('openid.claimed_id')
    
    if (mode !== 'id_res' || !claimedId) {
      console.error('Steam auth failed: invalid mode or claimed_id')
      return NextResponse.redirect(new URL('/login?error=steam_auth_failed', request.url))
    }
    
    // Steam ID 추출
    const steamId = extractSteamId(claimedId)
    
    if (!steamId) {
      console.error('Steam auth failed: invalid steam ID format')
      return NextResponse.redirect(new URL('/login?error=invalid_steam_id', request.url))
    }
    
    console.log('Steam ID extracted:', steamId)
    
    // Steam OpenID 검증
    const isValid = await validateSteamLogin(searchParams)
    
    if (!isValid) {
      console.error('Steam auth failed: validation failed')
      return NextResponse.redirect(new URL('/login?error=steam_validation_failed', request.url))
    }
    
    // Steam 사용자 정보 가져오기
    const steamUser = await getSteamUserInfo(steamId)
    
    if (!steamUser) {
      console.error('Steam auth failed: could not fetch user info')
      return NextResponse.redirect(new URL('/login?error=steam_user_info_failed', request.url))
    }
    
    console.log('Steam user info fetched:', steamUser.personaname)
    
    // Supabase에 사용자 생성 또는 로그인
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Steam ID를 이메일 형식으로 변환 (Supabase는 이메일이 필수)
    const steamEmail = `steam_${steamId}@ghostx.site`
    
    console.log('Processing Steam user:', steamEmail)
    
    // 기존 사용자 확인
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('steam_id', steamId)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile lookup error:', profileError)
      return NextResponse.redirect(new URL('/login?error=database_error', request.url))
    }
    
    if (existingProfile) {
      console.log('Existing user found, signing in...')
      // 기존 사용자 - 로그인 처리
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: steamEmail,
        password: steamId,
      })
      
      if (signInError) {
        console.error('Sign in error:', signInError)
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
      }
    } else {
      console.log('New user, signing up...')
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
        return NextResponse.redirect(new URL('/login?error=signup_failed', request.url))
      }
      
      // 프로필 생성
      const { error: insertError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: steamEmail,
        nickname: steamUser.personaname,
        steam_id: steamId,
        steam_avatar: steamUser.avatarfull,
        agreed_terms: true,
        agreed_privacy: true,
      })
      
      if (insertError) {
        console.error('Profile insert error:', insertError)
        return NextResponse.redirect(new URL('/login?error=profile_creation_failed', request.url))
      }
    }
    
    console.log('Steam login successful, redirecting to dashboard')
    // 로그인 성공 - 대시보드로 리다이렉트
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Unexpected error in Steam callback:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', request.url))
  }
}

