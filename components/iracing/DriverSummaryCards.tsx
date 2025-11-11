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

  const metrics = [
    {
      label: t.labels.irating,
      value: formatNumber(profile.irating, 0, locale),
      highlight: 'text-cyan-400',
      description: t.descriptions.irating,
    },
    {
      label: t.labels.safetyRating,
      value: profile.safetyRating !== null && profile.safetyRating !== undefined
        ? formatNumber(profile.safetyRating, 2, locale)
        : '-',
      highlight: 'text-green-400',
      description: t.descriptions.safetyRating,
    },
    {
      label: t.labels.winRate,
      value: profile.performance?.winRate !== undefined && profile.performance?.winRate !== null
        ? `${formatNumber(profile.performance.winRate, 1, locale)}%`
        : '-',
      highlight: 'text-amber-400',
      description: t.descriptions.winRate,
    },
    {
      label: t.labels.cleanRate,
      value: profile.performance?.cleanRaceRate !== undefined && profile.performance?.cleanRaceRate !== null
        ? `${formatNumber(profile.performance.cleanRaceRate, 1, locale)}%`
        : '-',
      highlight: 'text-emerald-400',
      description: t.descriptions.cleanRate,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-sm hover:border-gray-700 transition-colors"
        >
          <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{metric.label}</div>
          <div className={`text-2xl font-bold mb-2 ${metric.highlight}`}>{metric.value}</div>
          <div className="text-xs text-gray-500">{metric.description}</div>
        </div>
      ))}
    </div>
  )
}
