// Steam 프로필 관련 유틸리티 함수들

export interface SteamProfile {
  steamid: string
  personaname: string
  avatar: string
  realname?: string
}

// Steam 로그인 상태 확인 및 프로필 가져오기
export async function getSteamProfile(): Promise<SteamProfile | null> {
  try {
    const response = await fetch('/api/steam/profile')
    if (response.ok) {
      const data = await response.json()
      return data.profile
    }
    return null
  } catch (error) {
    console.error('Steam 프로필 가져오기 실패:', error)
    return null
  }
}

// 게임별 닉네임 저장 키 생성
export function getGameNicknameKey(gameName: string): string {
  return `nickname_${gameName}`
}

// 게임별 닉네임 가져오기
export function getGameNickname(gameName: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(getGameNicknameKey(gameName))
}

// 게임별 닉네임 저장
export function setGameNickname(gameName: string, nickname: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getGameNicknameKey(gameName), nickname)
}

// Steam 프로필명으로 기본 닉네임 설정
export async function initializeGameNickname(gameName: string): Promise<string> {
  // 기존 닉네임이 있으면 그대로 사용
  const existingNickname = getGameNickname(gameName)
  if (existingNickname) {
    return existingNickname
  }

  // Steam 프로필 가져오기
  const steamProfile = await getSteamProfile()
  if (steamProfile) {
    const defaultNickname = steamProfile.personaname
    setGameNickname(gameName, defaultNickname)
    return defaultNickname
  }

  // Steam 프로필이 없으면 기본값
  const fallbackNickname = `게스트_${Math.floor(Math.random() * 9999)}`
  setGameNickname(gameName, fallbackNickname)
  return fallbackNickname
}
