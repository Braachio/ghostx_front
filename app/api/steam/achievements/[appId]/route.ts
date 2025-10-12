import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const STEAM_API_KEY = process.env.STEAM_WEB_API_KEY

interface SteamAchievement {
  apiname: string
  achieved: number
  unlocktime: number
  name?: string
  description?: string
}

interface SteamAchievementSchema {
  name: string
  defaultvalue: number
  displayName: string
  hidden: number
  description: string
  icon: string
  icongray: string
}

/**
 * GET /api/steam/achievements/[appId]
 * 특정 게임의 사용자 업적 정보를 가져옵니다
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    if (!STEAM_API_KEY) {
      return NextResponse.json(
        { error: 'Steam API key not configured' },
        { status: 500 }
      )
    }

    const appId = params.appId
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

    // 1. 게임의 업적 스키마 가져오기
    const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appId}`
    const schemaResponse = await fetch(schemaUrl)
    const schemaData = await schemaResponse.json()

    const achievementSchema: SteamAchievementSchema[] = 
      schemaData.game?.availableGameStats?.achievements || []

    // 2. 사용자의 업적 달성 현황 가져오기
    const achievementsUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${appId}`
    const achievementsResponse = await fetch(achievementsUrl)
    const achievementsData = await achievementsResponse.json()

    if (!achievementsData.playerstats?.success) {
      return NextResponse.json(
        { error: 'Failed to fetch achievements', details: achievementsData.playerstats },
        { status: 404 }
      )
    }

    const userAchievements: SteamAchievement[] = 
      achievementsData.playerstats.achievements || []

    // 3. 스키마와 사용자 데이터 병합
    const achievements = achievementSchema.map(schema => {
      const userAch = userAchievements.find(
        ach => ach.apiname === schema.name
      )
      
      return {
        id: schema.name,
        displayName: schema.displayName,
        description: schema.description,
        icon: schema.icon,
        iconGray: schema.icongray,
        hidden: schema.hidden === 1,
        achieved: userAch?.achieved === 1,
        unlockTime: userAch?.unlocktime 
          ? new Date(userAch.unlocktime * 1000).toISOString()
          : null,
      }
    })

    const achievedCount = achievements.filter(a => a.achieved).length
    const totalCount = achievements.length
    const percentage = totalCount > 0 
      ? Math.round((achievedCount / totalCount) * 100)
      : 0

    return NextResponse.json({
      appId,
      gameName: achievementsData.playerstats.gameName,
      achievements,
      stats: {
        achieved: achievedCount,
        total: totalCount,
        percentage,
      },
    })
  } catch (error) {
    console.error('Steam achievements fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

