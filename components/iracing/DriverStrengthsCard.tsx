'use client'

import type { DriverStrength } from '@/lib/iracingTypes'
import { useLanguage } from '@/hooks/useLanguage'

const translations = {
  ko: {
    title: '주요 강점',
    labels: {
      series: '주요 시리즈',
      car: '선호 차량',
      track: '주요 트랙',
    },
    empty: (label: string) => `${label} 데이터 없음`,
    metrics: {
      starts: '출전',
      winRate: '우승률',
      avgFinish: '평균순위',
      bestResult: (pos: number) => `최고 성적 ${pos}위`,
    },
  },
  en: {
    title: 'Key Strengths',
    labels: {
      series: 'Series',
      car: 'Favorite Cars',
      track: 'Favorite Tracks',
    },
    empty: (label: string) => `No ${label.toLowerCase()} data`,
    metrics: {
      starts: 'Starts',
      winRate: 'Win Rate',
      avgFinish: 'Avg. Finish',
      bestResult: (pos: number) => `Best finish P${pos}`,
    },
  },
} as const

interface DriverStrengthsCardProps {
  strengths?: DriverStrength[] | null
}

function formatMetric(value?: number | null, fractionDigits = 1, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return `${value.toFixed(fractionDigits)}${suffix}`
}

export default function DriverStrengthsCard({ strengths }: DriverStrengthsCardProps) {
  if (!strengths || strengths.length === 0) return null

  const { language } = useLanguage()
  const t = translations[language as keyof typeof translations] ?? translations.ko
  const labels = t.labels

  const grouped: Record<'series' | 'car' | 'track', DriverStrength[]> = {
    series: [],
    car: [],
    track: [],
  }

  strengths.forEach((strength) => {
    grouped[strength.type].push(strength)
  })

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-5">{t.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(grouped) as Array<'series' | 'car' | 'track'>).map((key) => {
          const list = grouped[key]
          if (!list || list.length === 0) {
            return (
              <div key={key} className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 text-center text-gray-500 text-sm">
                {t.empty(labels[key])}
              </div>
            )
          }

          return (
            <div key={key} className="bg-gray-800/40 border border-gray-800 rounded-xl p-4">
              <div className="text-sm font-semibold text-gray-300 mb-3">{labels[key]}</div>
              <div className="space-y-3.5">
                {list.map((item) => (
                  <div key={`${key}-${item.label}`} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-base font-semibold text-white mb-1.5 truncate" title={item.label}>
                      {item.label}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div>
                        <span className="text-gray-500">{t.metrics.starts}</span>{' '}
                        <span className="text-cyan-300 font-semibold">{item.starts ?? '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t.metrics.winRate}</span>{' '}
                        <span className="text-amber-300 font-semibold">{formatMetric(item.winRate, 1, '%')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t.metrics.avgFinish}</span>{' '}
                        <span className="text-green-300 font-semibold">{formatMetric(item.avgFinish, 1)}</span>
                      </div>
                    </div>
                    {item.bestResult !== null && item.bestResult !== undefined && (
                      <div className="text-xs text-purple-300 mt-2.5">
                        {t.metrics.bestResult(item.bestResult === 0 ? 1 : item.bestResult)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
