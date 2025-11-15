'use client'

import type { IracingDriverDetail } from '@/lib/iracingTypes'
import { useLanguage } from '@/hooks/useLanguage'

const translations = {
  ko: {
    labels: {
      irating: 'IRating',
      safetyRating: 'Safety Rating',
      winRate: '우승률',
      cleanRate: '무사 완주율',
    },
    descriptions: {
      irating: '현재 공인 실력 지표',
      safetyRating: '클린 드라이빙 지표',
      winRate: '총 출전 대비 우승 비율',
      cleanRate: 'INC 0 또는 완주 기준 추정',
    },
    unavailable: '최근 레이스 없음',
  },
  en: {
    labels: {
      irating: 'iRating',
      safetyRating: 'Safety Rating',
      winRate: 'Win Rate',
      cleanRate: 'Incident-Free Rate',
    },
    descriptions: {
      irating: 'Current official skill measure',
      safetyRating: 'Clean driving indicator',
      winRate: 'Wins as a share of total starts',
      cleanRate: 'Estimated finish ratio with 0 INC',
    },
    unavailable: 'No recent races',
  },
} as const

interface DriverSummaryCardsProps {
  profile: IracingDriverDetail
}

const formatNumber = (value?: number | null, fractionDigits = 0, locale?: string) => {
  if (value === null || value === undefined) return '-'
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return value.toLocaleString(locale, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  })
}

export default function DriverSummaryCards({ profile }: DriverSummaryCardsProps) {
  const { language } = useLanguage()
  const t = translations[language as keyof typeof translations] ?? translations.ko
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  const isIRatingUnavailable = profile.irating === null || profile.irating === undefined
  const isSafetyRatingUnavailable = profile.safetyRating === null || profile.safetyRating === undefined
  
  // Safety Rating은 100배 값으로 저장되어 있으므로 100으로 나누어 표시
  const safetyRatingValue = profile.safetyRating !== null && profile.safetyRating !== undefined
    ? profile.safetyRating > 10 ? profile.safetyRating / 100 : profile.safetyRating
    : null
  
  const metrics = [
    {
      label: t.labels.irating,
      value: isIRatingUnavailable ? t.unavailable : formatNumber(profile.irating, 0, locale),
      highlight: isIRatingUnavailable ? 'text-gray-500' : 'text-cyan-400',
      description: t.descriptions.irating,
      unavailable: isIRatingUnavailable,
    },
    {
      label: t.labels.safetyRating,
      value: isSafetyRatingUnavailable ? t.unavailable : formatNumber(safetyRatingValue, 2, locale),
      highlight: isSafetyRatingUnavailable ? 'text-gray-500' : 'text-green-400',
      description: t.descriptions.safetyRating,
      unavailable: isSafetyRatingUnavailable,
    },
    {
      label: t.labels.winRate,
      value: profile.performance?.winRate !== undefined && profile.performance?.winRate !== null
        ? `${formatNumber(profile.performance.winRate, 1, locale)}%`
        : '-',
      highlight: 'text-amber-400',
      description: t.descriptions.winRate,
      unavailable: false,
    },
    {
      label: t.labels.cleanRate,
      value: profile.performance?.cleanRaceRate !== undefined && profile.performance?.cleanRaceRate !== null
        ? `${formatNumber(profile.performance.cleanRaceRate, 1, locale)}%`
        : '-',
      highlight: 'text-emerald-400',
      description: t.descriptions.cleanRate,
      unavailable: false,
    },
  ]

  return (
    <div className="space-y-4">
      {profile.warning && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 text-sm text-amber-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>{profile.warning}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`bg-gray-900/60 border rounded-2xl p-5 backdrop-blur-sm transition-colors ${
              metric.unavailable 
                ? 'border-gray-700/50 opacity-60' 
                : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{metric.label}</div>
            <div className={`text-2xl font-bold mb-2 ${metric.highlight}`}>{metric.value}</div>
            <div className="text-xs text-gray-500">{metric.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
