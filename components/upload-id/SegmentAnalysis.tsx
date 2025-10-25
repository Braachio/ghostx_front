'use client'
import React, { useEffect, useState } from 'react'
import SegmentControls from './SegmentControls'
import SegmentChart from './SegmentChart'
import SegmentInfoPanel from './SegmentInfoPanel'
// import SegmentDetailPanel from './SegmentDetailPanel'
import SegmentHoverTooltip from './SegmentHoverTooltip'
import type { ResultType } from '@/types/upload'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

// Segment 타입 정의
// brake_analysis의 피드백 포함
// data: 해당 세그먼트에 해당하는 주행 데이터
// brake_feedback: 선택 세그먼트의 브레이크 분석 피드백 문자열 (optional)
type Segment = {
  corner_index: number
  name: string
  start: number
  end: number
  data: Array<Record<string, number>>
  brake_feedback?: string
}

// 분석 메인 컴포넌트
export default function SegmentAnalysis({ result }: { result: ResultType }) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0)
  const [xAxisKey, setXAxisKey] = useState<'time' | 'distance'>('time')
  const [hoveredData, setHoveredData] = useState<Record<string, number> | null>(null)
  const [hoveredExitIndex, setHoveredExitIndex] = useState<number | null>(null)
  const [hoveredTrailIndex, setHoveredTrailIndex] = useState<number | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'braking' | 'throttle'>('throttle')

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchData = async () => {
      console.log('🧪 SegmentAnalysis props result:', result)

      // 🔐 lap_id 누락 방지
      if (!result?.lap_id) {
        console.warn('⚠️ result.lap_id is undefined. brake_analysis 쿼리를 생략합니다.')
        return
      }

      // 1️⃣ 코너 세그먼트 가져오기 (track 소문자로 변환)
      const trackName = result.track?.toLowerCase?.() ?? result.track
      const { data: cornerDefs, error: segError } = await supabase
        .from('corner_segments')
        .select('*')
        .eq('track', trackName)
        .order('corner_index', { ascending: true })

      if (segError) {
        console.error('❌ 코너 세그먼트 로딩 실패:', segError)
        return
      }

      console.log('📌 코너 세그먼트 로딩 완료:', cornerDefs)

      // 2️⃣ brake_analysis 조회
      const { data: brakeAnalysis, error: brakeError } = await supabase
        .from('brake_analysis')
        .select('*')
        .eq('lap_id', result.lap_id)

      if (brakeError) {
        console.error('❌ brake_analysis 로딩 실패:', brakeError)
      } else {
        console.log('📌 brake_analysis 로딩 완료:', brakeAnalysis)
      }

      // 3️⃣ 세그먼트 매핑 및 브레이크 피드백 포함
      const newSegments = (cornerDefs ?? []).map((seg) => {
        const startDist = typeof seg.start === 'string' ? parseFloat(seg.start) : seg.start
        const endDist = typeof seg.end_dist === 'string' ? parseFloat(seg.end_dist) : seg.end_dist

        const segmentData = (result.data || []).filter(
          (row) => row.distance >= startDist && row.distance <= endDist
        )

        const myBrake = (brakeAnalysis ?? []).find(
          (b) => b.corner_index === seg.corner_index
        )

        const fb = myBrake?.brake_start_dist != null
          ? `브레이크 시작 거리: ${myBrake.brake_start_dist.toFixed(1)}m`
          : undefined

        return {
          corner_index: seg.corner_index,
          name: seg.name || `구간 ${seg.corner_index}`,
          start: startDist,
          end: endDist,
          data: segmentData,
          brake_feedback: fb,
        }
      })

      console.log('📦 세그먼트 구성 완료:', newSegments)

      setSegments(newSegments)
    }

    fetchData()
  }, [result.track, result.data, result.lap_id, supabase])



  const segment = segments[selectedSegmentIndex] ?? []
  const segmentData = segment.data ?? []

  // 현재 세그먼트 주행 통계 계산
  // const stats = (() => {
  //   if (!segmentData.length) return { duration: '0', maxSpeed: '-', minSpeed: '-' }
  //   const duration = (segmentData.slice(-1)[0]?.time ?? 0) - (segmentData[0]?.time ?? 0)
  //   const speeds = segmentData.map((d) => d.speed).filter((v) => !isNaN(v))
  //   return {
  //     duration: duration.toFixed(2),
  //     maxSpeed: Math.max(...speeds).toFixed(1),
  //     minSpeed: Math.min(...speeds).toFixed(1),
  //   }
  // })()

  const segmentStartX = segmentData?.[0]?.[xAxisKey] ?? 0
  const segmentEndX = segmentData?.at(-1)?.[xAxisKey] ?? 0

  const exitFeedbacksInSegment = result.corner_exit_analysis?.filter((c) => {
    const xValue = result.data?.[c.start_idx]?.[xAxisKey]
    return xValue !== undefined && xValue >= segmentStartX && xValue <= segmentEndX
  }) ?? []

  const entryFeedbacksInSegment = result.corner_entry_analysis?.filter((c) => {
    const xValue = result.data?.[c.start_idx]?.[xAxisKey]
    return xValue !== undefined && xValue >= segmentStartX && xValue <= segmentEndX
  }) ?? []

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black shadow-2xl shadow-purple-500/10 rounded-2xl p-6 space-y-6 border-2 border-purple-500/30">
      {/* 구간 전환 및 분석 모드 선택 컨트롤 */}
      <SegmentControls
        segmentCount={segments.length}
        segmentNames={segments.map((s) => `${s.corner_index + 1}. ${s.name}`)}
        selectedSegmentIndex={selectedSegmentIndex}
        onSegmentChange={setSelectedSegmentIndex}
        xAxisKey={xAxisKey}
        onToggleXAxis={() => setXAxisKey(prev => prev === 'time' ? 'distance' : 'time')}
        analysisMode={analysisMode}
        onModeChange={setAnalysisMode}
      />

      {/* 주행 궤적 차트 */}
      <div className="relative">
        <SegmentHoverTooltip
          mode={analysisMode}
          hoveredExitIndex={hoveredExitIndex}
          hoveredTrailIndex={hoveredTrailIndex}
          exitFeedbacks={exitFeedbacksInSegment}
          entryFeedbacks={entryFeedbacksInSegment}
        />
        <SegmentChart
          data={segmentData}
          xAxisKey={xAxisKey}
          analysisMode={analysisMode}
          exitFeedbacks={exitFeedbacksInSegment}
          entryFeedbacks={entryFeedbacksInSegment}
          onHoverData={setHoveredData}
          onHoverExit={setHoveredExitIndex}
          onHoverTrail={setHoveredTrailIndex}
        />
      </div>

      {/* 구간 통계 및 데이터 값 출력 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* <SegmentDetailPanel track={result.track} car={result.car} stats={stats} /> */}
        <SegmentInfoPanel hoveredData={hoveredData} xAxisKey={xAxisKey} />
      </div>

      {/* 🔶 브레이크 분석 피드백 출력 */}
      {segment.brake_feedback && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/30 text-yellow-300 rounded-lg p-4 shadow-lg shadow-yellow-500/10">
          <p className="text-sm font-semibold">👻 고스트카 분석: {segment.brake_feedback}</p>
        </div>
      )}

      {/* 🛠 준비 중 기능 안내 */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4">
        <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 min-h-[160px] max-w-[445px]">
          <p className="text-cyan-300 text-base font-semibold text-center">
            🧭 고스트카 주행 라인 시각화 기능은 준비 중입니다.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-gray-900/20 p-4 min-h-[160px] max-w-[445px]">
          <p className="text-purple-300 text-base font-semibold text-center">
            🛠 고스트카 비교 분석 기능은 준비 중입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
