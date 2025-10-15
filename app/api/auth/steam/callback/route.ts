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
  
  // localhost 환경 감지
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1'
  const baseUrl = isLocalhost 
    ? `${request.nextUrl.protocol}//${request.nextUrl.host}` 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://ghostx.site')
  
  console.log('=== Steam Callback Debug ===')
  console.log('Request URL:', request.url)
  console.log('Environment:', { isLocalhost, baseUrl })
  console.log('Search params:', Object.fromEntries(searchParams.entries()))
  
  try {
    // OpenID 응답 검증
    const mode = searchParams.get('openid.mode')
    const claimedId = searchParams.get('openid.claimed_id')
    
    console.log('Mode:', mode)
    console.log('Claimed ID:', claimedId)
    
    if (mode !== 'id_res' || !claimedId) {
      console.error('Steam auth failed: invalid mode or claimed_id')
      console.error('Expected mode: id_res, got:', mode)
      console.error('Claimed ID:', claimedId)
      return NextResponse.redirect(new URL('/login?error=steam_auth_failed', baseUrl))
    }
    
    // Steam ID 추출
    const steamId = extractSteamId(claimedId)
    
    if (!steamId) {
      console.error('Steam auth failed: invalid steam ID format')
      return NextResponse.redirect(new URL('/login?error=invalid_steam_id', baseUrl))
    }
    
    console.log('Steam ID extracted:', steamId)
    
    // Steam OpenID 검증
    const isValid = await validateSteamLogin(searchParams)
    
    if (!isValid) {
      console.error('Steam auth failed: validation failed')
      return NextResponse.redirect(new URL('/login?error=steam_validation_failed', baseUrl))
    }
    
  // Steam 사용자 정보 가져오기
  const steamUser = await getSteamUserInfo(steamId)
  
  if (!steamUser) {
    console.error('Steam auth failed: could not fetch user info')
    console.error('Steam ID:', steamId)
    console.error('Steam API Key configured:', !!process.env.STEAM_WEB_API_KEY)
    return NextResponse.redirect(new URL('/login?error=steam_user_info_failed', baseUrl))
  }
  
  console.log('Steam user info fetched:', steamUser.personaname)
  console.log('Steam user details:', {
    steamid: steamUser.steamid,
    personaname: steamUser.personaname,
    profileurl: steamUser.profileurl,
    avatarfull: steamUser.avatarfull
  })
    
    // Supabase 설정 확인
    console.log('Supabase configuration check:')
    console.log('- URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('- Anon Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('- Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('- Steam API Key configured:', !!process.env.STEAM_WEB_API_KEY)
    
    // Supabase에 사용자 생성 또는 로그인
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Steam ID를 이메일 형식으로 변환 (Supabase는 이메일이 필수)
    const steamEmail = `steam_${steamId}@ghostx.site`
    
    console.log('Processing Steam user:', steamEmail)
    
    // 더 안전한 방식: 항상 로그인 먼저 시도, 실패하면 회원가입
    console.log('Attempting Steam user login/signup...')
    
    let finalUser = null
    
    // 1. 먼저 로그인 시도 (기존 사용자)
    console.log('Attempting login for existing user...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: steamEmail,
      password: steamId,
    })
    
    if (!signInError && signInData?.user) {
      console.log('Existing user signed in successfully')
      finalUser = signInData.user
    } else {
      console.log('Login failed, attempting signup for new user...', signInError?.message)
      
      // 2. 로그인 실패 시 회원가입 시도 (새 사용자)
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
      
      if (signUpError) {
        console.error('Both login and signup failed:', signUpError)
        // 회원가입도 실패한 경우, 이미 등록된 사용자일 가능성
        if (signUpError.message?.includes('already registered')) {
          console.log('User already registered, forcing login attempt...')
          // 강제로 로그인 재시도
          const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
            email: steamEmail,
            password: steamId,
          })
          
          if (retryError || !retrySignIn?.user) {
            console.error('Final login attempt failed:', retryError)
            return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(retryError?.message || 'Login failed')}`, baseUrl))
          }
          
          finalUser = retrySignIn.user
          console.log('Forced login successful')
        } else {
          return NextResponse.redirect(new URL(`/login?error=signup_failed&details=${encodeURIComponent(signUpError.message)}`, baseUrl))
        }
      } else {
        finalUser = authData?.user
        console.log('New user created successfully')
      }
    }
    
    if (!finalUser) {
      console.error('No user created or signed in')
      return NextResponse.redirect(new URL('/login?error=unexpected_error', baseUrl))
    }
    
    console.log('User authenticated successfully:', finalUser.id)
    
    // 2. 프로필 업데이트 (Steam 정보 최신화)
    console.log('Updating profile with latest Steam info...')
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: finalUser.id,
      email: steamEmail,
      nickname: steamUser.personaname,
      steam_id: steamId,
      steam_avatar: steamUser.avatarfull,
      agreed_terms: true,
      agreed_privacy: true,
    })
    
    if (profileError) {
      console.error('Profile upsert error:', profileError)
      console.error('Profile error details:', {
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      })
      
      // steam_id 컬럼이 없을 수 있으므로 기본 프로필만 업데이트 시도
      const { error: basicProfileError } = await supabase.from('profiles').upsert({
        id: finalUser.id,
        email: steamEmail,
        nickname: steamUser.personaname,
        agreed_terms: true,
        agreed_privacy: true,
      })
      
      if (basicProfileError) {
        console.error('Basic profile update also failed:', basicProfileError)
        // 프로필 업데이트 실패해도 로그인은 성공으로 처리
        console.log('Continuing despite profile update failure...')
      } else {
        console.log('Basic profile updated successfully (steam_id column may be missing)')
      }
    } else {
      console.log('Profile updated successfully with Steam data')
    }
    
    console.log('Steam login successful, redirecting to main page')
    // 로그인 성공 - 메인페이지로 리다이렉트
    return NextResponse.redirect(new URL('/', baseUrl))
  } catch (error) {
    console.error('Unexpected error in Steam callback:', error)
    return NextResponse.redirect(new URL('/login?error=unexpected_error', baseUrl))
  }
}

