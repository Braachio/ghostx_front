/**
 * 레이싱 게임 데이터베이스
 * Steam App ID와 게임 정보 매핑
 */

export interface RacingGame {
  appId: number
  name: string
  displayName: string
  category: 'sim' | 'simcade' | 'arcade'
  platform: 'pc' | 'console' | 'both'
  releaseYear: number
  icon?: string
}

export const RACING_GAMES: RacingGame[] = [
  // 시뮬레이션 레이싱 게임
  {
    appId: 244210,
    name: 'assetto-corsa-competizione',
    displayName: 'Assetto Corsa Competizione',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2019,
  },
  {
    appId: 287700,
    name: 'assetto-corsa',
    displayName: 'Assetto Corsa',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2014,
  },
  {
    appId: 431600,
    name: 'iracing',
    displayName: 'iRacing',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2008,
  },
  {
    appId: 1066890,
    name: 'automobilista2',
    displayName: 'Automobilista 2',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2020,
  },
  {
    appId: 1989900,
    name: 'lemans-ultimate',
    displayName: 'Le Mans Ultimate',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2023,
  },
  {
    appId: 805550,
    name: 'rfactor2',
    displayName: 'rFactor 2',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2013,
  },
  {
    appId: 1158310,
    name: 'iracing-2020',
    displayName: 'iRacing (2020 Season)',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2020,
  },
  
  // F1 시리즈
  {
    appId: 2488620,
    name: 'f1-25',
    displayName: 'F1 25',
    category: 'simcade',
    platform: 'both',
    releaseYear: 2025,
  },
  {
    appId: 2488620,
    name: 'f1-24',
    displayName: 'F1 24',
    category: 'simcade',
    platform: 'both',
    releaseYear: 2024,
  },
  {
    appId: 2108330,
    name: 'f1-23',
    displayName: 'F1 23',
    category: 'simcade',
    platform: 'both',
    releaseYear: 2023,
  },
  {
    appId: 1692250,
    name: 'f1-22',
    displayName: 'F1 22',
    category: 'simcade',
    platform: 'both',
    releaseYear: 2022,
  },

  // WRC 시리즈
  {
    appId: 1849250,
    name: 'ea-wrc',
    displayName: 'EA SPORTS WRC',
    category: 'sim',
    platform: 'both',
    releaseYear: 2023,
  },
  {
    appId: 1593280,
    name: 'wrc-generations',
    displayName: 'WRC Generations',
    category: 'sim',
    platform: 'both',
    releaseYear: 2022,
  },

  // 기타 레이싱
  {
    appId: 774491,
    name: 'project-cars-3',
    displayName: 'Project CARS 3',
    category: 'simcade',
    platform: 'pc',
    releaseYear: 2020,
  },
  {
    appId: 378860,
    name: 'project-cars-2',
    displayName: 'Project CARS 2',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2017,
  },
  {
    appId: 234630,
    name: 'project-cars',
    displayName: 'Project CARS',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2015,
  },
  {
    appId: 1293830,
    name: 'forza-horizon-4',
    displayName: 'Forza Horizon 4',
    category: 'arcade',
    platform: 'pc',
    releaseYear: 2018,
  },
  {
    appId: 1551360,
    name: 'forza-horizon-5',
    displayName: 'Forza Horizon 5',
    category: 'arcade',
    platform: 'pc',
    releaseYear: 2021,
  },
  {
    appId: 1551370,
    name: 'forza-motorsport',
    displayName: 'Forza Motorsport',
    category: 'simcade',
    platform: 'pc',
    releaseYear: 2023,
  },
  {
    appId: 1180140,
    name: 'dirt-rally-2',
    displayName: 'DiRT Rally 2.0',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2019,
  },
  {
    appId: 310560,
    name: 'dirt-rally',
    displayName: 'DiRT Rally',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2015,
  },
  {
    appId: 1846760,
    name: 'kartkraft',
    displayName: 'KartKraft',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2018,
  },
  {
    appId: 1088850,
    name: 'acc-official',
    displayName: 'Assetto Corsa Competizione (Official)',
    category: 'sim',
    platform: 'pc',
    releaseYear: 2019,
  },
  
  // 추가 레이싱 게임들
  {
    appId: 239140,
    name: 'dirt-3',
    displayName: 'DiRT 3',
    category: 'arcade',
    platform: 'pc',
    releaseYear: 2011,
  },
  {
    appId: 321040,
    name: 'dirt-showdown',
    displayName: 'DiRT Showdown',
    category: 'arcade',
    platform: 'pc',
    releaseYear: 2012,
  },
  {
    appId: 266840,
    name: 'grid-autosport',
    displayName: 'GRID Autosport',
    category: 'simcade',
    platform: 'pc',
    releaseYear: 2014,
  },
  {
    appId: 1272080,
    name: 'grid-legends',
    displayName: 'GRID Legends',
    category: 'simcade',
    platform: 'both',
    releaseYear: 2022,
  },
  {
    appId: 1543420,
    name: 'f1-21',
    displayName: 'F1 2021',
    category: 'simcade',
    platform: 'both',
    releaseYear: 2021,
  },
  {
    appId: 1244460,
    name: 'forza-horizon-4-pc',
    displayName: 'Forza Horizon 4 (PC)',
    category: 'arcade',
    platform: 'pc',
    releaseYear: 2021,
  },
  {
    appId: 1426210,
    name: 'forza-motorsport-7',
    displayName: 'Forza Motorsport 7',
    category: 'simcade',
    platform: 'pc',
    releaseYear: 2017,
  },
  {
    appId: 1434950,
    name: 'forza-horizon-3',
    displayName: 'Forza Horizon 3',
    category: 'arcade',
    platform: 'pc',
    releaseYear: 2016,
  },
]

/**
 * Steam App ID로 레이싱 게임 찾기
 */
export function findRacingGame(appId: number): RacingGame | undefined {
  return RACING_GAMES.find(game => game.appId === appId)
}

/**
 * 게임 이름으로 레이싱 게임 찾기
 */
export function findRacingGameByName(name: string): RacingGame | undefined {
  const lowerName = name.toLowerCase()
  return RACING_GAMES.find(
    game => 
      game.name.toLowerCase() === lowerName ||
      game.displayName.toLowerCase() === lowerName ||
      game.displayName.toLowerCase().includes(lowerName) ||
      lowerName.includes(game.displayName.toLowerCase())
  )
}

/**
 * 레이싱 게임인지 확인
 */
export function isRacingGame(appId: number): boolean {
  return RACING_GAMES.some(game => game.appId === appId)
}

/**
 * 카테고리별 레이싱 게임 필터링
 */
export function getRacingGamesByCategory(
  category: 'sim' | 'simcade' | 'arcade'
): RacingGame[] {
  return RACING_GAMES.filter(game => game.category === category)
}

