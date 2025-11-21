'use client'

import type { DriverHighlight } from '@/lib/iracingTypes'
import { useLanguage } from '@/hooks/useLanguage'

type HighlightType = NonNullable<DriverHighlight['type']>

const translations = {
  ko: {
    title: '하이라이트',
    items: {
      careerWins: (data: DriverHighlight['data'], locale: string) => ({
        title: '누적 우승',
        description: data?.wins !== undefined && data?.wins !== null
          ? `${Number(data.wins).toLocaleString(locale)}회 우승 기록`
          : '우승 기록',
      }),
      winRate: (data: DriverHighlight['data']) => ({
        title: '우승 비율',
        description: data?.winRate !== undefined && data?.winRate !== null
          ? `우승 확률 ${Number(data.winRate).toFixed(1)}%`
          : '우승 확률 지표',
      }),
      recentBestFinish: (data: DriverHighlight['data']) => {
        const location =
          (typeof data?.track === 'string' && data.track) ||
          (typeof data?.series === 'string' && data.series) ||
          '최근 레이스'
        const position =
          typeof data?.finishPosition === 'number'
            ? data.finishPosition === 0
              ? 1
              : data.finishPosition
            : null
        return {
          title: '최근 베스트 피니시',
          description: position
            ? `${location}에서 ${position}위 달성`
            : `${location}에서 베스트 피니시`,
        }
      },
      maxIrGain: (data: DriverHighlight['data']) => {
        const gain =
          typeof data?.irGain === 'number'
            ? data.irGain.toFixed(0)
            : null
        const series =
          (typeof data?.series === 'string' && data.series) || '레이스'
        return {
          title: '최대 iRating 상승',
          description: gain
            ? `${gain} iR 상승 (${series})`
            : `iRating 상승 (${series})`,
        }
      },
    } satisfies Partial<Record<HighlightType, (data: DriverHighlight['data'], locale: string) => { title: string; description: string }>>,
  },
  en: {
    title: 'Highlights',
    items: {
      careerWins: (data: DriverHighlight['data'], locale: string) => ({
        title: 'Career Wins',
        description: data?.wins !== undefined && data?.wins !== null
          ? `${Number(data.wins).toLocaleString(locale)} wins recorded`
          : 'Recorded wins',
      }),
      winRate: (data: DriverHighlight['data']) => ({
        title: 'Win Rate',
        description: data?.winRate !== undefined && data?.winRate !== null
          ? `Win probability ${Number(data.winRate).toFixed(1)}%`
          : 'Win probability indicator',
      }),
      recentBestFinish: (data: DriverHighlight['data']) => {
        const location =
          (typeof data?.track === 'string' && data.track) ||
          (typeof data?.series === 'string' && data.series) ||
          'recent race'
        const position =
          typeof data?.finishPosition === 'number'
            ? data.finishPosition === 0
              ? 1
              : data.finishPosition
            : null
        return {
          title: 'Recent Best Finish',
          description: position
            ? `Finished P${position} at ${location}`
            : `Best finish at ${location}`,
        }
      },
      maxIrGain: (data: DriverHighlight['data']) => {
        const gain =
          typeof data?.irGain === 'number'
            ? data.irGain.toFixed(0)
            : null
        const series =
          (typeof data?.series === 'string' && data.series) || 'race'
        return {
          title: 'Largest iRating Gain',
          description: gain
            ? `${gain} iR gain (${series})`
            : `iRating gain (${series})`,
        }
      },
    } satisfies Partial<Record<HighlightType, (data: DriverHighlight['data'], locale: string) => { title: string; description: string }>>,
  },
} as const

interface DriverHighlightsProps {
  highlights?: DriverHighlight[] | null
}

const formatTimestamp = (value?: string, locale: string = 'ko-KR') => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function DriverHighlights({ highlights }: DriverHighlightsProps) {
  const { language } = useLanguage()
  const t = translations[language as keyof typeof translations] ?? translations.ko
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  if (!highlights || highlights.length === 0) return null

  const getLocalizedHighlight = (highlight: DriverHighlight) => {
    const type = highlight.type as HighlightType | undefined
    if (type && t.items[type]) {
      return t.items[type](highlight.data, locale)
    }
    return {
      title: highlight.title,
      description: highlight.description,
    }
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-4">{t.title}</h3>
      <div className="space-y-3">
        {highlights.map((highlight, index) => {
          const localized = getLocalizedHighlight(highlight)
          const formattedTimestamp = formatTimestamp(highlight.timestamp, locale)
          return (
            <div
              key={`${highlight.title}-${index}`}
              className="bg-gray-800/40 border border-gray-800 rounded-xl p-4 flex items-start gap-3"
            >
              <div className="text-xl">✨</div>
              <div>
                <div className="text-sm font-semibold text-white mb-1">{localized.title}</div>
                <div className="text-xs text-gray-400 leading-5">{localized.description}</div>
                {formattedTimestamp && (
                  <div className="text-[11px] text-gray-500 mt-2">{formattedTimestamp}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
