'use client'

import type { DriverRecentRace } from '@/lib/iracingTypes'
import { useLanguage } from '@/hooks/useLanguage'

const translations = {
  ko: {
    title: '최근 레이스 기록',
    recentCount: (count: number) => `최근 ${count}전`,
    headers: {
      datetime: '일시',
      seriesTrack: '시리즈 / 트랙',
      car: '차량',
      position: '순위',
      irChange: 'iR 변화',
      incidents: 'INC',
      sof: 'SoF',
    },
    startPosition: (pos: number) => `스타트 ${pos}`,
  },
  en: {
    title: 'Recent Race History',
    recentCount: (count: number) => `Last ${count} races`,
    headers: {
      datetime: 'Date & Time',
      seriesTrack: 'Series / Track',
      car: 'Car',
      position: 'Finish',
      irChange: 'iR Δ',
      incidents: 'INC',
      sof: 'SoF',
    },
    startPosition: (pos: number) => `Start P${pos}`,
  },
} as const

interface DriverRecentResultsProps {
  races?: DriverRecentRace[] | null
}

const formatDateTime = (value?: string | null, locale = 'ko-KR') => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const formatNumber = (value?: number | null, digits = 0, sign = false) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  const formatted = value.toFixed(digits)
  return sign && value > 0 ? `+${formatted}` : formatted
}

export default function DriverRecentResults({ races }: DriverRecentResultsProps) {
  const { language } = useLanguage()
  const t = translations[language as keyof typeof translations] ?? translations.ko
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  if (!races || races.length === 0) return null

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{t.title}</h3>
        <span className="text-xs text-gray-500">{t.recentCount(races.length)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-3 py-2 text-left">{t.headers.datetime}</th>
              <th className="px-3 py-2 text-left">{t.headers.seriesTrack}</th>
              <th className="px-3 py-2 text-left">{t.headers.car}</th>
              <th className="px-3 py-2 text-center">{t.headers.position}</th>
              <th className="px-3 py-2 text-center">{t.headers.irChange}</th>
              <th className="px-3 py-2 text-center">{t.headers.incidents}</th>
              <th className="px-3 py-2 text-center">{t.headers.sof}</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => (
              <tr key={race.subsessionId} className="border-t border-gray-800/80">
                <td className="px-3 py-3 text-gray-300 whitespace-nowrap">{formatDateTime(race.startTime, locale)}</td>
                <td className="px-3 py-3">
                  <div className="text-white font-medium truncate" title={race.seriesName || undefined}>
                    {race.seriesName || '-'}
                  </div>
                  <div className="text-xs text-gray-500 truncate" title={race.track || undefined}>
                    {race.track || '-'}
                  </div>
                </td>
                <td className="px-3 py-3 text-gray-300 text-xs truncate" title={race.car || undefined}>
                  {race.car || '-'}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-lg font-semibold text-white">
                    {race.finishPosition ?? '-'}
                  </span>
                  {race.startPosition !== null && race.startPosition !== undefined && (
                    <div className="text-[11px] text-gray-500">{t.startPosition(race.startPosition)}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className={`font-semibold ${
                    (race.iratingChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {formatNumber(race.iratingChange, 0, true)}
                  </span>
                </td>
                <td className="px-3 py-3 text-center text-gray-300">
                  {formatNumber(race.incidents, 0)}
                </td>
                <td className="px-3 py-3 text-center text-gray-300">
                  {formatNumber(race.strengthOfField, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
