'use client'

import type { FC } from 'react'

type RivalInsightCard = {
  label: string
  position?: string
  offset?: string
  irGap?: string
  incidents?: string
  dnf?: string
  recent?: string
  advice?: string
}

type StrategyRecommendation = {
  strategy: string
  confidence: number
  reasoning: string[]
  analyzedFactors?: string[]
  actionableInsights?: string[]
  keyFactors?: string[]
  actionItems?: string[]
  actions?: string[]
  detailedStrategy?: {
    start?: string[]
    mid?: string[]
    end?: string[]
  }
  rivalInsights?: {
    front?: RivalInsightCard | null
    rear?: RivalInsightCard | null
  }
}

type PredictionModes = {
  available: string[]
  used?: string | null
}

interface AIStrategyCardProps {
  overallStrategy: StrategyRecommendation
  showStartInfo: boolean
  startPosition: number | string | null
  qualifyingPosition: number | string | null
  predictedRank: number | null
  startGridLabel: string
  startGridUnknown: string
  startGridQualFallback: (pos: number) => string
  predictionModes?: PredictionModes
  analyzedFactors?: string[] | null
  actionableInsights?: string[] | null
  rivalInsights?: {
    front?: RivalInsightCard | null
    rear?: RivalInsightCard | null
  }
}

const normalizePosition = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  const numeric = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
    return null
  }
  return numeric
}

const formatStartGrid = (
  position: number | string | null,
  fallbackPosition: number | string | null,
  startGridUnknown: string,
  startGridQualFallback: (pos: number) => string
) => {
  const normalizedPrimary = normalizePosition(position)
  if (normalizedPrimary !== null) {
    return `P${normalizedPrimary + 1}`
  }
  const normalizedFallback = normalizePosition(fallbackPosition)
  if (normalizedFallback !== null) {
    return startGridQualFallback(normalizedFallback)
  }
  return startGridUnknown
}

const renderList = (items: string[], bullet: string) => (
  <ul className="space-y-1.5 text-sm text-emerald-100">
    {items.map((text, idx) => (
      <li key={`${bullet}-${idx}-${text.slice(0, 16)}`} className="flex items-start gap-2">
        <span className={`text-emerald-400 mt-0.5 ${bullet ? '' : 'hidden'}`}>{bullet}</span>
        <span>{text}</span>
      </li>
    ))}
  </ul>
)

const AIStrategyCard: FC<AIStrategyCardProps> = ({
  overallStrategy,
  showStartInfo,
  startPosition,
  qualifyingPosition,
  predictedRank,
  startGridLabel,
  startGridUnknown,
  startGridQualFallback,
  predictionModes,
  analyzedFactors,
  actionableInsights,
  rivalInsights,
}) => {
  console.log('AI Strategy Data:', {
    strategy: overallStrategy,
    analyzedFactors,
    actionableInsights,
    predictionModes,
    rivalInsights,
  })
  const reasoning = overallStrategy.reasoning || []
  const startStrategies = reasoning.filter((r) => r.startsWith('시작:'))
  const midStrategies = reasoning.filter((r) => r.startsWith('중반부:'))
  const endStrategies = reasoning.filter((r) => r.startsWith('후반부:'))
  const otherReasons = reasoning.filter(
    (r) => !r.startsWith('시작:') && !r.startsWith('중반부:') && !r.startsWith('후반부:')
  )

  const fallbackAnalyzed = overallStrategy.analyzedFactors || []
  const derivedAnalyzed = Array.isArray(analyzedFactors) && analyzedFactors.length > 0
    ? analyzedFactors
    : fallbackAnalyzed
  const hasAnalyzedFactors = derivedAnalyzed.length > 0
  const situationItems = hasAnalyzedFactors
    ? derivedAnalyzed
    : otherReasons
  const keyFactors = overallStrategy.keyFactors || []

  const fallbackActionItems =
    overallStrategy.actionableInsights ||
    overallStrategy.actionItems ||
    overallStrategy.actions ||
    []
  const hasActionableInsights =
    Array.isArray(actionableInsights) && actionableInsights.length > 0
  const primaryActionItems = hasActionableInsights
    ? actionableInsights!
    : fallbackActionItems

  const detailStart =
    overallStrategy.detailedStrategy?.start && overallStrategy.detailedStrategy.start.length > 0
      ? overallStrategy.detailedStrategy.start
      : startStrategies.map((reason) => reason.replace('시작: ', ''))
  const detailMid =
    overallStrategy.detailedStrategy?.mid && overallStrategy.detailedStrategy.mid.length > 0
      ? overallStrategy.detailedStrategy.mid
      : midStrategies.map((reason) => reason.replace('중반부: ', ''))
  const detailEnd =
    overallStrategy.detailedStrategy?.end && overallStrategy.detailedStrategy.end.length > 0
      ? overallStrategy.detailedStrategy.end
      : endStrategies.map((reason) => reason.replace('후반부: ', ''))

  const startGridDisplay = formatStartGrid(
    startPosition,
    qualifyingPosition,
    startGridUnknown,
    startGridQualFallback
  )

  const rivalCards = [
    rivalInsights?.front || overallStrategy.rivalInsights?.front || null,
    rivalInsights?.rear || overallStrategy.rivalInsights?.rear || null,
  ]
  const hasRivalCards = rivalCards.some((card) => card)

  const renderRivalCard = (card: RivalInsightCard, index: number) => {
    const isFront = index === 0
    const accent =
      isFront
        ? 'from-rose-900/30 to-red-900/30 border-rose-500/40'
        : 'from-sky-900/30 to-blue-900/30 border-sky-500/40'
    const badgeColor = isFront ? 'text-rose-200' : 'text-sky-200'
    const metrics = [card.irGap, card.incidents, card.dnf, card.recent].filter(
      (item): item is string => typeof item === 'string' && item.length > 0
    )

    return (
      <div
        key={`${card.label}-${index}`}
        className={`rounded-xl border px-4 py-3 bg-gradient-to-br ${accent} text-emerald-50`}
      >
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className={badgeColor}>{card.label}</span>
          <span className="text-base text-white">{card.position ?? '-'}</span>
        </div>
        {card.offset && (
          <div className="text-xs text-emerald-200/80 mt-0.5">{card.offset}</div>
        )}
        {metrics.length > 0 && (
          <div className="mt-2 text-xs text-emerald-50/90 space-y-1">
            {metrics.map((metric) => (
              <div key={`${card.label}-${metric}`} className="flex items-center gap-2">
                <span className="text-emerald-400/70">•</span>
                <span>{metric}</span>
              </div>
            ))}
          </div>
        )}
        {card.advice && (
          <div className="mt-2 text-xs text-emerald-100">{card.advice}</div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-5 bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-600/50 rounded-xl p-5">
      <div className="text-sm text-emerald-200 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
        <span>AI 전략 제안</span>
        <span className="text-emerald-400 text-xs">
          신뢰도: {Math.round((overallStrategy.confidence ?? 0) * 100)}%
        </span>
      </div>

      {showStartInfo && (
        <div className="mb-3 text-xs text-emerald-200/90 flex items-center gap-2">
          <span className="text-emerald-300 flex items-center gap-1">
            <span role="img" aria-label="grid">
              🚦
            </span>
            {startGridLabel}
          </span>
          <span className="text-emerald-100 font-semibold">{startGridDisplay}</span>
          {predictedRank !== null && (
            <span className="ml-auto inline-flex items-center gap-1 text-emerald-300">
              <span role="img" aria-label="target">🎯</span>
              예상 P{predictedRank}
            </span>
          )}
        </div>
      )}

      {hasRivalCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {rivalCards.map((card, idx) =>
            card ? renderRivalCard(card, idx) : null
          )}
        </div>
      )}

      <div className="mb-4">
        <span
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
            overallStrategy.strategy === 'aggressive'
              ? 'bg-red-600/30 text-red-200 border border-red-500/50'
              : overallStrategy.strategy === 'defensive'
                ? 'bg-yellow-600/30 text-yellow-200 border border-yellow-500/50'
                : overallStrategy.strategy === 'survival'
                  ? 'bg-orange-600/30 text-orange-200 border border-orange-500/50'
                  : 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50'
          }`}
        >
          {overallStrategy.strategy === 'aggressive'
            ? '공격적 전략'
            : overallStrategy.strategy === 'defensive'
              ? '방어적 전략'
              : overallStrategy.strategy === 'survival'
                ? '생존 모드'
                : '균형 전략'}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-emerald-300/70 uppercase tracking-wide mb-2">
            상황 분석
          </div>
          {situationItems.length > 0 ? (
            renderList(situationItems, hasAnalyzedFactors ? '' : '•')
          ) : (
            <p className="text-sm text-emerald-200/70">특이사항 없음</p>
          )}
        </div>

        {keyFactors.length > 0 && (
          <div>
            <div className="text-xs text-emerald-300/70 uppercase tracking-wide mb-2">
              주요 요인 (Key Factors)
            </div>
            {renderList(keyFactors, '•')}
          </div>
        )}

        {primaryActionItems.length > 0 && (
          <div>
            <div className="text-xs text-emerald-300/70 uppercase tracking-wide mb-2">
              추천 액션 (Action Items)
            </div>
            {renderList(primaryActionItems, hasActionableInsights ? '✓' : '•')}
          </div>
        )}

        {(detailStart.length > 0 || detailMid.length > 0 || detailEnd.length > 0) && (
          <div className="border-t border-emerald-700/50 pt-3">
            <div className="text-xs text-emerald-300/70 uppercase tracking-wide mb-2">
              단계별 전략
            </div>

            <>
              {detailStart.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-cyan-300 font-semibold mb-1">🚩 레이스 시작</div>
                  <ul className="space-y-1 text-sm text-emerald-100">
                    {detailStart.map((text, idx) => (
                      <li key={`start-${idx}-${text.slice(0, 16)}`} className="flex items-start gap-2">
                        <span className="text-cyan-400 mt-0.5">→</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailMid.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-yellow-300 font-semibold mb-1">⚡ 중반부</div>
                  <ul className="space-y-1 text-sm text-emerald-100">
                    {detailMid.map((text, idx) => (
                      <li key={`mid-${idx}-${text.slice(0, 16)}`} className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5">→</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detailEnd.length > 0 && (
                <div>
                  <div className="text-xs text-purple-300 font-semibold mb-1">🏁 후반부</div>
                  <ul className="space-y-1 text-sm text-emerald-100">
                    {detailEnd.map((text, idx) => (
                      <li key={`end-${idx}-${text.slice(0, 16)}`} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">→</span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          </div>
        )}

        {predictionModes?.available?.length ? (
          <div className="mt-4 pt-3 border-t border-emerald-700/50 text-xs text-gray-400">
            사용 모델:{' '}
            {predictionModes.available
              .map((mode) => (mode === 'post' ? '그리드 기준' : '레이스 전'))
              .join(' / ')}
            {predictionModes.used && (
              <span className="ml-2 text-emerald-400">
                (활성: {predictionModes.used === 'post' ? '그리드 기준' : '레이스 전'})
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AIStrategyCard

