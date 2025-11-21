'use client'

import type { DriverConsistencyMetrics } from '@/lib/iracingTypes'
import { useLanguage } from '@/hooks/useLanguage'

const translations = {
  ko: {
    title: '안정성 & 경쟁 강도',
    metrics: {
      avgInc: { label: '평균 Inc', description: '최근 레이스 기준 평균 인시던트' },
      cleanRate: { label: '무사 완주율', description: 'INC 0 또는 완주 비율' },
      dnfRate: { label: 'DNF 비율', description: 'DNF 발생률 (데이터 제공 시)' },
      sof: { label: '평균 SoF', description: '참가한 세션의 평균 SoF' },
    },
  },
  en: {
    title: 'Consistency & Competition',
    metrics: {
      avgInc: { label: 'Avg. Inc', description: 'Average incidents (recent races)' },
      cleanRate: { label: 'Incident-Free Rate', description: 'Share of races finished with 0 INC' },
      dnfRate: { label: 'DNF Rate', description: 'DNF percentage (when data available)' },
      sof: { label: 'Avg. SoF', description: 'Average Strength of Field in sessions' },
    },
  },
} as const

interface DriverConsistencyCardProps {
  consistency?: DriverConsistencyMetrics | null
}

const formatNumber = (value?: number | null, digits = 1, suffix = '') => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return `${value.toFixed(digits)}${suffix}`
}

export default function DriverConsistencyCard({ consistency }: DriverConsistencyCardProps) {
  const { language } = useLanguage()
  const t = translations[language as keyof typeof translations] ?? translations.ko
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  if (!consistency) return null

  const metrics = [
    {
      label: t.metrics.avgInc.label,
      value: formatNumber(consistency.avgIncidents, 1),
      description: t.metrics.avgInc.description,
    },
    {
      label: t.metrics.cleanRate.label,
      value: formatNumber(consistency.cleanRaceRate, 1, '%'),
      description: t.metrics.cleanRate.description,
    },
    {
      label: t.metrics.dnfRate.label,
      value: consistency.dnfRate !== null && consistency.dnfRate !== undefined
        ? formatNumber(consistency.dnfRate * 100, 1, '%')
        : '-',
      description: t.metrics.dnfRate.description,
    },
    {
      label: t.metrics.sof.label,
      value: consistency.strengthOfField !== null && consistency.strengthOfField !== undefined
        ? Number.isNaN(consistency.strengthOfField)
          ? '-'
          : consistency.strengthOfField.toLocaleString(locale, { maximumFractionDigits: 0 })
        : '-',
      description: t.metrics.sof.description,
    },
  ]

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-4">{t.title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-gray-800/40 border border-gray-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-300 mb-2">{metric.label}</div>
            <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
            <div className="text-xs text-gray-500">{metric.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
