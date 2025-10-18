import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const STEAM_API_KEY = process.env.STEAM_WEB_API_KEY

interface SteamPlayer {
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
  timecreated?: number
}

interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  playtime_2weeks?: number
  img_icon_url: string
  img_logo_url: string
}

/**
 * GET /api/steam/profile
 * 현재 로그인한 사용자의 Steam 프로필 정보를 가져옵니다
 */
export async function GET() {
  try {
    if (!STEAM_API_KEY) {
      return NextResponse.json(
        { error: 'Steam API key not configured' },
        { status: 500 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // 현재 사용자 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 사용자 프로필에서 Steam ID 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('steam_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile?.steam_id) {
      return NextResponse.json(
        { error: 'Steam account not linked' },
        { status: 404 }
      )
    }

    const steamId = profile.steam_id

    // 1. 사용자 프로필 정보 가져오기
    const profileUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
    const profileResponse = await fetch(profileUrl)
    const profileData = await profileResponse.json()
    
    if (!profileData.response?.players?.[0]) {
      return NextResponse.json(
        { error: 'Steam profile not found' },
        { status: 404 }
      )
    }

    const player: SteamPlayer = profileData.response.players[0]

    // 2. 레이싱 게임만 필터링하여 가져오기
    const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`
    const gamesResponse = await fetch(gamesUrl)
    const gamesData = await gamesResponse.json()

    const allGames: SteamGame[] = gamesData.response?.games || []
    
    // 레이싱 게임 필터링 (앱 ID 기반)
    const racingGameAppIds = [
      2315,    // iRacing
      244210,  // Assetto Corsa
      1446780, // Gran Turismo 7
      805550,  // Assetto Corsa Competizione
      2420500, // Le Mans Ultimate
      2420500, // F1 25
      1066890, // Automobilista 2
      2073850, // EA WRC
    ]
    
    const racingGames = allGames.filter(game => 
      racingGameAppIds.includes(game.appid) ||
      game.name.toLowerCase().includes('racing') ||
      game.name.toLowerCase().includes('sim') ||
      game.name.toLowerCase().includes('track') ||
      game.name.toLowerCase().includes('formula') ||
      game.name.toLowerCase().includes('gt') ||
      game.name.toLowerCase().includes('f1')
    )

    // 3. 최근 플레이한 게임 가져오기 (레이싱 게임만)
    const recentGamesUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&count=10`
    const recentGamesResponse = await fetch(recentGamesUrl)
    const recentGamesData = await recentGamesResponse.json()

    const allRecentGames: SteamGame[] = recentGamesData.response?.games || []
    const recentRacingGames = allRecentGames.filter(game => 
      racingGameAppIds.includes(game.appid) ||
      game.name.toLowerCase().includes('racing') ||
      game.name.toLowerCase().includes('sim') ||
      game.name.toLowerCase().includes('track') ||
      game.name.toLowerCase().includes('formula') ||
      game.name.toLowerCase().includes('gt') ||
      game.name.toLowerCase().includes('f1')
    )

    return NextResponse.json({
      profile: {
        steamId: player.steamid,
        username: player.personaname,
        profileUrl: player.profileurl,
        avatar: player.avatarfull,
        avatarMedium: player.avatarmedium,
        accountCreated: player.timecreated ? new Date(player.timecreated * 1000).toISOString() : null,
      },
      racingGames: racingGames.map(game => ({
        appId: game.appid,
        name: game.name,
        playtimeForever: game.playtime_forever,
        playtimeTwoWeeks: game.playtime_2weeks || 0,
        iconUrl: game.img_icon_url 
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
          : null,
        logoUrl: game.img_logo_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`
          : null,
      })),
      recentRacingGames: recentRacingGames.map(game => ({
        appId: game.appid,
        name: game.name,
        playtimeForever: game.playtime_forever,
        playtimeTwoWeeks: game.playtime_2weeks || 0,
        iconUrl: game.img_icon_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
          : null,
      })),
      totalRacingGames: racingGames.length,
      totalRacingPlaytime: racingGames.reduce((sum, game) => sum + game.playtime_forever, 0),
    })
  } catch (error) {
    console.error('Steam profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Steam profile' },
      { status: 500 }
    )
  }
}

