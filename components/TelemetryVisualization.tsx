'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceArea } from 'recharts'
import type { TelemetrySession, TelemetrySample } from '@/lib/iracingTypes'

const ENABLE_TRACK_MAP = false

type ChartMouseEvent = {
  activePayload?: Array<{
    payload?: {
      time?: number
    }
  }>
}

interface TelemetryVisualizationProps {
  sessionId: string
}

export default function TelemetryVisualization({ sessionId }: TelemetryVisualizationProps) {
  const [session, setSession] = useState<TelemetrySession | null>(null)
  const [samples, setSamples] = useState<TelemetrySample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedChart, setSelectedChart] = useState<'speed' | 'pedals' | 'tires' | 'gforce'>('speed')
  // hoveredTime은 주행라인 비활성화 시 사용되지 않음 (주행라인 재활성화 시 사용)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 타이어/G-Force 차트를 볼 때만 advanced 데이터 포함 (성능 최적화)
        const needsAdvanced = selectedChart === 'tires' || selectedChart === 'gforce'
        const includeAdvancedParam = needsAdvanced ? '&include_advanced=true' : ''
        
        // limit를 지정하지 않으면 전체 데이터를 가져옴
        const res = await fetch(`/api/iracing/telemetry/sessions/${sessionId}?downsample=1${includeAdvancedParam}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || '데이터 조회 실패')
        }

        const sampleCount = data.samples?.length || 0
        const totalCount = data.total_count || 0
        
        console.log('[TelemetryViz] API Response:', {
          sessionId,
          sampleCount,
          totalCount,
          hasSamples: Array.isArray(data.samples) && data.samples.length > 0,
          receivedAll: sampleCount === totalCount,
        })

        // 시간 범위 확인
        if (data.samples && data.samples.length > 0) {
          const times = data.samples.map((s: TelemetrySample) => s.elapsed_time || 0).filter((t: number) => t != null)
          const minTime = Math.min(...times)
          const maxTime = Math.max(...times)
          console.log(`[TelemetryViz] Time range in received data: ${minTime.toFixed(3)}s to ${maxTime.toFixed(3)}s (duration: ${(maxTime - minTime).toFixed(3)}s)`)
        }

        setSession(data.session)
        setSamples(data.samples || [])
        setTotalCount(totalCount)
        
        // 샘플이 없는데 total_count가 있으면 에러 메시지 표시
        if ((!data.samples || data.samples.length === 0) && data.total_count > 0) {
          setError(`샘플이 ${data.total_count}개 있지만 조회에 실패했습니다. (limit 초과 가능성)`)
        } else if (sampleCount > 0 && totalCount > 0 && sampleCount < totalCount) {
          // 일부 데이터만 받은 경우 경고 메시지 (에러는 아니지만 정보 제공)
          console.warn(`[TelemetryViz] Warning: Received ${sampleCount} samples but ${totalCount} total samples exist in database`)
        }
      } catch (e) {
        console.error('[TelemetryViz] Fetch error:', e)
        setError(e instanceof Error ? e.message : '알 수 없는 오류')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchData()
    }
  }, [sessionId, selectedChart])  // selectedChart가 변경되면 advanced 데이터 재요청

  // 차트 데이터 준비 (시간을 0부터 시작하도록 정규화)
  const { chartData, maxTime } = useMemo(() => {
    if (!samples || samples.length === 0) {
      return { chartData: [], maxTime: 0 }
    }

    let minTime = samples[0].elapsed_time ?? 0
    let maxTimeRaw = samples[0].elapsed_time ?? 0
    for (let i = 1; i < samples.length; i++) {
      const t = samples[i].elapsed_time ?? 0
      if (t < minTime) {
        minTime = t
      }
      if (t > maxTimeRaw) {
        maxTimeRaw = t
      }
    }

    const normalized = samples.map((sample, index) => {
      const normalizedTime = (sample.elapsed_time ?? 0) - minTime
      return {
        time: normalizedTime,
        timeDisplay: normalizedTime.toFixed(1),
        speed: sample.speed_kmh || 0,
        throttle: (sample.throttle_position || 0) * 100,
        brake: (sample.brake_position || 0) * 100,
        steering: sample.steering_angle || 0,
        tireFL: sample.tire_temp_fl || 0,
        tireFR: sample.tire_temp_fr || 0,
        tireRL: sample.tire_temp_rl || 0,
        tireRR: sample.tire_temp_rr || 0,
        gLat: sample.g_force_lateral || 0,
        gLong: sample.g_force_longitudinal || 0,
        rpm: sample.rpm || 0,
        gear: sample.gear || 0,
        positionX: sample.position_x || 0,
        positionY: sample.position_y || 0,
        heading: sample.heading || 0,
        index,
      }
    })

    const maxTime = normalized.length > 0 ? normalized[normalized.length - 1].time : 0

    return { chartData: normalized, maxTime: maxTime >= 0 ? maxTime : maxTimeRaw - minTime }
  }, [samples])

  const [visibleStart, setVisibleStart] = useState(0)
  const [visibleEnd, setVisibleEnd] = useState(0)
  
  // MoTeC 스타일: 선택 모드
  const [isSelectingMode, setIsSelectingMode] = useState(false) // 더블클릭으로 활성화되는 선택 모드
  const [isSelecting, setIsSelecting] = useState(false) // 실제 드래그 중
  const [isMovingSelection, setIsMovingSelection] = useState(false)
  const [selectionStartTime, setSelectionStartTime] = useState<number | null>(null)
  const [selectionEndTime, setSelectionEndTime] = useState<number | null>(null) // 선택된 영역의 끝 시간 (확대용)
  const [selectionPreviewTime, setSelectionPreviewTime] = useState<number | null>(null)
  const [dragStartTime, setDragStartTime] = useState<number | null>(null)
  const [dragStartVisibleStart, setDragStartVisibleStart] = useState(0)
  const [dragStartVisibleEnd, setDragStartVisibleEnd] = useState(0)
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    setVisibleStart(0)
    setVisibleEnd(maxTime || 0)
    setIsSelectingMode(false)
    setIsSelecting(false)
    setIsMovingSelection(false)
    setSelectionStartTime(null)
    setSelectionEndTime(null)
    setSelectionPreviewTime(null)
    setDragStartTime(null)
    setMouseDownPos(null)
  }, [maxTime, sessionId])

  const filteredChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return []
    if (visibleEnd <= visibleStart) return chartData
    return chartData.filter((point) => point.time >= visibleStart && point.time <= visibleEnd)
  }, [chartData, visibleStart, visibleEnd])

  const sliderMax = Math.max(maxTime, 0)
  const sliderStep = sliderMax > 0 ? Math.max(0.01, parseFloat((sliderMax / 200).toFixed(3))) : 0.1
  const minGap = sliderMax > 0 ? Math.min(sliderStep, sliderMax) : sliderStep

  // 차트 컨테이너 ref (드래그 이벤트 처리용)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // X 좌표를 시간으로 변환하는 함수 (Recharts 차트 영역 기준)
  const getTimeFromX = useCallback((clientX: number): number | null => {
    if (sliderMax <= 0 || !chartContainerRef.current) return null
    
    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const width = rect.width
    
    // Recharts의 XAxis는 좌우에 약 50-70px의 패딩을 가짐
    // 실제 차트 영역은 중앙 부분
    const leftPadding = 60
    const rightPadding = 20
    const chartWidth = width - leftPadding - rightPadding
    
    if (chartWidth <= 0) return null
    
    // 마우스 X 좌표를 차트 영역 내 상대 위치로 변환
    const relativeX = (x - leftPadding) / chartWidth
    const clampedX = Math.max(0, Math.min(1, relativeX))
    
    // 현재 visible 범위 기준으로 시간 계산
    const range = visibleEnd - visibleStart
    const time = visibleStart + clampedX * range
    
    return Math.max(0, Math.min(sliderMax, time))
  }, [sliderMax, visibleStart, visibleEnd])

  // MoTeC 스타일: 마우스 이동 처리 (드래그 중)
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    const clientX = 'clientX' in event ? event.clientX : (event as MouseEvent).clientX
    const clientY = 'clientY' in event ? event.clientY : (event as MouseEvent).clientY
    const time = getTimeFromX(clientX)
    if (time === null) return
    
    // 선택 모드가 활성화되어 있고, 마우스 다운 위치가 있고, 아직 선택이 시작되지 않았다면 드래그 거리 확인
    if (isSelectingMode && mouseDownPos && !isSelecting && !isMovingSelection) {
      const dragDistance = Math.sqrt(
        Math.pow(clientX - mouseDownPos.x, 2) + Math.pow(clientY - mouseDownPos.y, 2)
      )
      const timeDistance = Math.abs(time - mouseDownPos.time)
      
      // 드래그가 5px 이상 또는 시간 차이가 0.1초 이상일 때만 선택 시작
      if (dragDistance > 5 || timeDistance > 0.1) {
        const isShiftPressed = 'shiftKey' in event ? event.shiftKey : (event as MouseEvent).shiftKey
        if (isShiftPressed) {
          // Shift + 드래그: 선택 영역 이동 시작
          setIsMovingSelection(true)
          setDragStartTime(time)
          setDragStartVisibleStart(visibleStart)
          setDragStartVisibleEnd(visibleEnd)
        } else {
          // 일반 드래그: 새로운 영역 선택 시작 (확대하지 않고 선택만)
          setIsSelecting(true)
          setSelectionStartTime(mouseDownPos.time)
          setSelectionPreviewTime(time)
        }
      }
      return
    }
    
    // 선택 중이면 프리뷰 업데이트
    if (isSelecting && selectionStartTime !== null) {
      setSelectionPreviewTime(time)
    } else if (isMovingSelection && dragStartTime !== null) {
      // 선택 영역 이동
      const delta = time - dragStartTime
      const range = dragStartVisibleEnd - dragStartVisibleStart
      let newStart = dragStartVisibleStart + delta
      let newEnd = dragStartVisibleEnd + delta
      
      // 범위 제한
      if (newStart < 0) {
        newStart = 0
        newEnd = range
      } else if (newEnd > sliderMax) {
        newEnd = sliderMax
        newStart = sliderMax - range
      }
      
      setVisibleStart(newStart)
      setVisibleEnd(newEnd)
    }
  }, [isSelectingMode, isSelecting, isMovingSelection, selectionStartTime, dragStartTime, dragStartVisibleStart, dragStartVisibleEnd, sliderMax, getTimeFromX, mouseDownPos, visibleStart, visibleEnd])

  // 전역 마우스 이동 (차트 밖으로 나갔을 때도 처리)
  const handleGlobalMouseMove = useCallback((event: MouseEvent) => {
    if (!chartContainerRef.current) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    
    // 차트 영역 내부 또는 근처인 경우에만 처리
    if (x >= rect.left - 50 && x <= rect.right + 50 && y >= rect.top - 50 && y <= rect.bottom + 50) {
      handleMouseMove(event)
    }
  }, [handleMouseMove])

  // MoTeC 스타일: 선택 완료 (드래그 종료 시)
  const finalizeSelection = useCallback(() => {
    // 클릭만 했고 드래그가 없었다면 아무 일도 하지 않음
    if (mouseDownPos && !isSelecting && !isMovingSelection) {
      setMouseDownPos(null)
      return
    }
    
    // 선택 모드에서 드래그로 영역 선택 완료 (확대하지 않고 선택만 저장)
    if (isSelecting && selectionStartTime !== null && selectionPreviewTime !== null) {
      const start = Math.min(selectionStartTime, selectionPreviewTime)
      const end = Math.max(selectionStartTime, selectionPreviewTime)
      const clampedStart = Math.max(0, Math.min(start, sliderMax - minGap))
      const clampedEnd = Math.max(clampedStart + minGap, Math.min(end, sliderMax))
      
      // 영역 선택만 저장 (확대하지 않음)
      setSelectionStartTime(clampedStart)
      setSelectionEndTime(clampedEnd)
      setSelectionPreviewTime(null)
    }
    
    if (isMovingSelection && dragStartTime !== null) {
      // 이동 완료 - 이미 visibleStart/End가 업데이트됨
    }
    
    setIsSelecting(false)
    setIsMovingSelection(false)
    setDragStartTime(null)
    setMouseDownPos(null)
  }, [isSelecting, isMovingSelection, selectionStartTime, selectionPreviewTime, dragStartTime, sliderMax, minGap, mouseDownPos])

  useEffect(() => {
    window.addEventListener('mouseup', finalizeSelection)
    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => {
      window.removeEventListener('mouseup', finalizeSelection)
      window.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [finalizeSelection, handleGlobalMouseMove])


  const handleChartMouseMove = useCallback(
    (state?: ChartMouseEvent) => {
      if (ENABLE_TRACK_MAP && !isSelecting && !isMovingSelection && !isSelectingMode) {
        const payload = state?.activePayload && state.activePayload[0]?.payload
        const time = payload?.time
        if (typeof time === 'number') {
          setHoveredTime(time)
        }
      }
    },
    [isSelecting, isMovingSelection, isSelectingMode],
  )

  const handleChartMouseLeave = useCallback(() => {
    if (ENABLE_TRACK_MAP && !isSelecting && !isMovingSelection && !isSelectingMode) {
      setHoveredTime(null)
    }
  }, [isSelecting, isMovingSelection, isSelectingMode])

  // 선택 모드 취소 (차트 외부 클릭 또는 ESC 키)
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (isSelectingMode && chartContainerRef.current) {
      const target = event.target as HTMLElement
      if (!chartContainerRef.current.contains(target)) {
        setIsSelectingMode(false)
        setSelectionStartTime(null)
        setSelectionEndTime(null)
      }
    }
  }, [isSelectingMode])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSelectingMode) {
        setIsSelectingMode(false)
        setSelectionStartTime(null)
        setSelectionEndTime(null)
      }
    }
    
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isSelectingMode, handleClickOutside])

  // MoTeC 스타일: 더블클릭으로 선택 모드 활성화
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsSelectingMode(true)
    },
    [],
  )

  // MoTeC 스타일: 마우스 다운 - 선택 모드에서만 드래그 시작
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      
      // 선택 모드가 아니면 아무 일도 하지 않음
      if (!isSelectingMode) return
      
      event.preventDefault()
      event.stopPropagation()
      
      const time = getTimeFromX(event.clientX)
      if (time === null) return
      
      // 마우스 다운 위치만 저장 (드래그 거리 확인을 위해)
      setMouseDownPos({
        x: event.clientX,
        y: event.clientY,
        time: time,
      })
    },
    [getTimeFromX, isSelectingMode],
  )

  // MoTeC 스타일: 휠 이벤트
  // Shift + 스크롤: 좌우 이동
  // Ctrl + 스크롤: 확대/축소 (현재 범위 중심 기준)
  const handleChartWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (sliderMax <= 0) return
      
      event.preventDefault()
      event.stopPropagation()

      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX
      if (delta === 0) return
      const direction = delta > 0 ? 1 : -1
      
      if (event.shiftKey && !event.ctrlKey) {
        // Shift + 스크롤: 좌우 이동
        const range = visibleEnd - visibleStart
        if (range <= minGap || range >= sliderMax) return
        
        const step = Math.max(minGap, range * 0.08)
        let newStart = visibleStart + direction * step
        newStart = Math.min(Math.max(0, newStart), Math.max(0, sliderMax - range))
        let newEnd = newStart + range
        if (newEnd > sliderMax) {
          newEnd = sliderMax
          newStart = sliderMax - range
        }
        
        setVisibleStart(newStart)
        setVisibleEnd(newEnd)
      } else if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd + 스크롤: 확대/축소 (현재 범위 중심 기준)
        const range = visibleEnd - visibleStart
        const center = (visibleStart + visibleEnd) / 2
        const zoomFactor = 1.1
        const newRange = direction > 0 
          ? Math.min(range * zoomFactor, sliderMax)
          : Math.max(range / zoomFactor, minGap)
        
        let newStart = center - newRange / 2
        let newEnd = center + newRange / 2
        
        if (newStart < 0) {
          newStart = 0
          newEnd = newRange
        } else if (newEnd > sliderMax) {
          newEnd = sliderMax
          newStart = sliderMax - newRange
        }
        
        setVisibleStart(newStart)
        setVisibleEnd(newEnd)
      }
    },
    [sliderMax, visibleStart, visibleEnd, minGap],
  )

  // MoTeC 스타일: 선택 영역 표시용
  // 드래그 중이면 프리뷰 시간 사용, 드래그 완료 후에는 선택된 영역 사용
  const selectionX1 = isSelecting && selectionStartTime !== null 
    ? selectionStartTime 
    : (!isSelecting && selectionStartTime !== null ? selectionStartTime : null)
  const selectionX2 = isSelecting && selectionPreviewTime !== null
    ? selectionPreviewTime
    : (!isSelecting && selectionEndTime !== null ? selectionEndTime : null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300">
        {error}
      </div>
    )
  }

  if (!samples || samples.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-900/60 border border-gray-800 rounded-2xl">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">데이터가 없습니다</h3>
        <p className="text-gray-500">이 세션에는 텔레메트리 샘플이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 세션 정보 */}
      {session && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
            <div>
              <div className="text-gray-400 text-xs mb-1">트랙</div>
              <div className="text-white font-semibold">{session.track_name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">차량</div>
              <div className="text-white font-semibold">{session.car_name || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">지속 시간</div>
              <div className="text-white font-semibold">
                {session.duration_seconds ? `${session.duration_seconds.toFixed(1)}초` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">샘플 수</div>
              <div className="text-white font-semibold">
                {samples.length.toLocaleString()}개
                {totalCount !== null && totalCount > samples.length && (
                  <span className="text-yellow-400 ml-1">({totalCount.toLocaleString()}개 중)</span>
                )}
              </div>
            </div>
          </div>
          {/* 데이터 불일치 경고 */}
          {totalCount !== null && totalCount > samples.length && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-2 text-xs text-yellow-300">
              ⚠️ 경고: DB에 {totalCount.toLocaleString()}개의 샘플이 있지만, {samples.length.toLocaleString()}개만 표시됩니다. 
              서버 콘솔 로그를 확인해주세요.
            </div>
          )}
        </div>
      )}

      {/* 주행 라인 - 디폴트로 항상 표시 (렉 방지를 위해 일시적으로 비활성화) */}
      {/* <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">주행 라인</h3>
        <div className="relative w-full" style={{ height: '600px' }}>
          <TrackMap samples={chartData} hoveredTime={hoveredTime} />
        </div>
      </div> */}

      {/* 타임라인 범위 슬라이더 */}
      {chartData.length > 0 && sliderMax > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">⏱ 구간 선택 (MoTeC 스타일)</h3>
              <p className="text-sm text-gray-400">
                더블클릭으로 선택 모드 활성화 → 드래그로 영역 선택 | 선택된 영역 더블클릭으로 확대 | Shift+스크롤로 이동 | Ctrl+스크롤로 확대/축소
              </p>
            </div>
            <button
              onClick={() => {
                setVisibleStart(0)
                setVisibleEnd(maxTime || 0)
              }}
              className="self-start px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
              disabled={visibleStart <= 0 && visibleEnd >= (maxTime || 0)}
            >
              전체 구간 보기
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>시작 {visibleStart.toFixed(1)}s</span>
            <span>끝 {visibleEnd.toFixed(1)}s</span>
          </div>

          <div className="relative flex flex-col gap-2">
            <input
              type="range"
              min={0}
              max={sliderMax}
              step={sliderStep}
              value={Math.max(0, Math.min(visibleStart, visibleEnd - minGap))}
              onChange={(e) => {
                const value = Number(e.target.value)
                const clamped = Math.max(0, Math.min(value, visibleEnd - minGap))
                setVisibleStart(clamped)
              }}
              className="w-full accent-cyan-500"
            />
            <input
              type="range"
              min={0}
              max={sliderMax}
              step={sliderStep}
              value={Math.max(minGap, Math.min(visibleEnd, sliderMax))}
              onChange={(e) => {
                const value = Number(e.target.value)
                const clamped = Math.min(sliderMax, Math.max(value, visibleStart + minGap))
                setVisibleEnd(clamped)
              }}
              className="w-full accent-blue-500"
            />
          </div>

          <div className="text-xs text-gray-500 text-right">
            선택된 구간: {Math.max(0, visibleEnd - visibleStart).toFixed(1)}초
          </div>
        </div>
      )}

      {/* 차트 선택 탭 */}
      <div className="flex items-center gap-2 border-b border-gray-800">
        <button
          onClick={() => setSelectedChart('speed')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            selectedChart === 'speed'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          속도/기어
          {selectedChart === 'speed' && (
            <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
          )}
        </button>
        <button
          onClick={() => setSelectedChart('pedals')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            selectedChart === 'pedals'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          페달/스티어링
          {selectedChart === 'pedals' && (
            <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
          )}
        </button>
        <button
          onClick={() => setSelectedChart('tires')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            selectedChart === 'tires'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          타이어 온도
          {selectedChart === 'tires' && (
            <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
          )}
        </button>
        <button
          onClick={() => setSelectedChart('gforce')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            selectedChart === 'gforce'
              ? 'text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          G-Force
          {selectedChart === 'gforce' && (
            <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
          )}
        </button>
      </div>

      {/* 차트 */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        {selectedChart === 'speed' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">속도 및 기어</h3>
            <div
              ref={chartContainerRef}
              className="chart-container relative w-full h-[400px]"
            >
              {/* 투명한 드래그 오버레이 */}
              <div
                className={`absolute inset-0 z-10 ${isSelectingMode ? 'cursor-crosshair' : 'cursor-default'}`}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onWheel={handleChartWheel}
                onMouseLeave={handleChartMouseLeave}
                style={{ pointerEvents: 'auto' }}
              />
              {/* 선택 모드 표시 */}
              {isSelectingMode && (
                <div className="absolute top-2 right-2 z-20 bg-cyan-600/80 text-white text-xs px-2 py-1 rounded">
                  선택 모드 활성화 - 드래그로 영역 선택 | 클릭으로 취소
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={filteredChartData}
                  onMouseMove={(state) => {
                    // 드래그 중이 아니고 선택 모드가 아닐 때만 호버 처리
                    if (!isSelecting && !isMovingSelection && !isSelectingMode) {
                      handleChartMouseMove(state)
                    }
                  }}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {selectionX1 !== null && selectionX2 !== null && (
                    <ReferenceArea
                      x1={Math.min(selectionX1, selectionX2)}
                      x2={Math.max(selectionX1, selectionX2)}
                      fill="rgba(56, 189, 248, 0.3)"
                      stroke="rgba(56, 189, 248, 0.8)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      onDoubleClick={() => {
                        // 선택된 영역 더블클릭 시 확대
                        if (selectionStartTime !== null && selectionEndTime !== null) {
                          setVisibleStart(Math.min(selectionStartTime, selectionEndTime))
                          setVisibleEnd(Math.max(selectionStartTime, selectionEndTime))
                        }
                      }}
                      style={{ cursor: selectionStartTime !== null && selectionEndTime !== null ? 'pointer' : 'default' }}
                    />
                  )}
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timeDisplay" stroke="#9CA3AF" label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }} />
                <YAxis yAxisId="left" stroke="#60A5FA" label={{ value: '속도 (km/h)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#F472B6" label={{ value: 'RPM', angle: 90, position: 'insideRight' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="speed"
                  stroke="#60A5FA"
                  fill="#60A5FA"
                  fillOpacity={0.3}
                  name="속도 (km/h)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rpm"
                  stroke="#F472B6"
                  strokeWidth={2}
                  name="RPM"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="gear"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="기어"
                  dot={false}
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'pedals' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">페달 입력 및 스티어링</h3>
            <div
              ref={chartContainerRef}
              className="chart-container relative w-full h-[400px]"
            >
              {/* 투명한 드래그 오버레이 */}
              <div
                className={`absolute inset-0 z-10 ${isSelectingMode ? 'cursor-crosshair' : 'cursor-default'}`}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onWheel={handleChartWheel}
                onMouseLeave={handleChartMouseLeave}
                style={{ pointerEvents: 'auto' }}
              />
              {/* 선택 모드 표시 */}
              {isSelectingMode && (
                <div className="absolute top-2 right-2 z-20 bg-cyan-600/80 text-white text-xs px-2 py-1 rounded">
                  선택 모드 활성화 - 드래그로 영역 선택 | 클릭으로 취소
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={filteredChartData}
                  onMouseMove={(state) => {
                    // 드래그 중이 아니고 선택 모드가 아닐 때만 호버 처리
                    if (!isSelecting && !isMovingSelection && !isSelectingMode) {
                      handleChartMouseMove(state)
                    }
                  }}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {selectionX1 !== null && selectionX2 !== null && (
                    <ReferenceArea
                      x1={Math.min(selectionX1, selectionX2)}
                      x2={Math.max(selectionX1, selectionX2)}
                      fill="rgba(56, 189, 248, 0.3)"
                      stroke="rgba(56, 189, 248, 0.8)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      onDoubleClick={() => {
                        // 선택된 영역 더블클릭 시 확대
                        if (selectionStartTime !== null && selectionEndTime !== null) {
                          setVisibleStart(Math.min(selectionStartTime, selectionEndTime))
                          setVisibleEnd(Math.max(selectionStartTime, selectionEndTime))
                        }
                      }}
                      style={{ cursor: selectionStartTime !== null && selectionEndTime !== null ? 'pointer' : 'default' }}
                    />
                  )}
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timeDisplay" stroke="#9CA3AF" label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9CA3AF" label={{ value: '입력 (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="throttle"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  name="스로틀 (%)"
                />
                <Area
                  type="monotone"
                  dataKey="brake"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.3}
                  name="브레이크 (%)"
                />
                <Line
                  type="monotone"
                  dataKey="steering"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="스티어링 (라디안)"
                  dot={false}
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'tires' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">타이어 온도</h3>
            <div
              ref={chartContainerRef}
              className="chart-container relative w-full h-[400px]"
            >
              {/* 투명한 드래그 오버레이 */}
              <div
                className={`absolute inset-0 z-10 ${isSelectingMode ? 'cursor-crosshair' : 'cursor-default'}`}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onWheel={handleChartWheel}
                onMouseLeave={handleChartMouseLeave}
                style={{ pointerEvents: 'auto' }}
              />
              {/* 선택 모드 표시 */}
              {isSelectingMode && (
                <div className="absolute top-2 right-2 z-20 bg-cyan-600/80 text-white text-xs px-2 py-1 rounded">
                  선택 모드 활성화 - 드래그로 영역 선택 | 클릭으로 취소
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={filteredChartData}
                  onMouseMove={(state) => {
                    // 드래그 중이 아니고 선택 모드가 아닐 때만 호버 처리
                    if (!isSelecting && !isMovingSelection && !isSelectingMode) {
                      handleChartMouseMove(state)
                    }
                  }}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {selectionX1 !== null && selectionX2 !== null && (
                    <ReferenceArea
                      x1={Math.min(selectionX1, selectionX2)}
                      x2={Math.max(selectionX1, selectionX2)}
                      fill="rgba(56, 189, 248, 0.3)"
                      stroke="rgba(56, 189, 248, 0.8)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      onDoubleClick={() => {
                        // 선택된 영역 더블클릭 시 확대
                        if (selectionStartTime !== null && selectionEndTime !== null) {
                          setVisibleStart(Math.min(selectionStartTime, selectionEndTime))
                          setVisibleEnd(Math.max(selectionStartTime, selectionEndTime))
                        }
                      }}
                      style={{ cursor: selectionStartTime !== null && selectionEndTime !== null ? 'pointer' : 'default' }}
                    />
                  )}
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timeDisplay" stroke="#9CA3AF" label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9CA3AF" label={{ value: '온도 (°C)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Line type="monotone" dataKey="tireFL" stroke="#EF4444" strokeWidth={2} name="전좌" dot={false} />
                <Line type="monotone" dataKey="tireFR" stroke="#3B82F6" strokeWidth={2} name="전우" dot={false} />
                <Line type="monotone" dataKey="tireRL" stroke="#10B981" strokeWidth={2} name="후좌" dot={false} />
                <Line type="monotone" dataKey="tireRR" stroke="#F59E0B" strokeWidth={2} name="후우" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'gforce' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">G-Force</h3>
            <div
              ref={chartContainerRef}
              className="chart-container relative w-full h-[400px]"
            >
              {/* 투명한 드래그 오버레이 */}
              <div
                className={`absolute inset-0 z-10 ${isSelectingMode ? 'cursor-crosshair' : 'cursor-default'}`}
                onDoubleClick={handleDoubleClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onWheel={handleChartWheel}
                onMouseLeave={handleChartMouseLeave}
                style={{ pointerEvents: 'auto' }}
              />
              {/* 선택 모드 표시 */}
              {isSelectingMode && (
                <div className="absolute top-2 right-2 z-20 bg-cyan-600/80 text-white text-xs px-2 py-1 rounded">
                  선택 모드 활성화 - 드래그로 영역 선택 | 클릭으로 취소
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={filteredChartData}
                  onMouseMove={(state) => {
                    // 드래그 중이 아니고 선택 모드가 아닐 때만 호버 처리
                    if (!isSelecting && !isMovingSelection && !isSelectingMode) {
                      handleChartMouseMove(state)
                    }
                  }}
                  onMouseLeave={handleChartMouseLeave}
                >
                  {selectionX1 !== null && selectionX2 !== null && (
                    <ReferenceArea
                      x1={Math.min(selectionX1, selectionX2)}
                      x2={Math.max(selectionX1, selectionX2)}
                      fill="rgba(56, 189, 248, 0.3)"
                      stroke="rgba(56, 189, 248, 0.8)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      onDoubleClick={() => {
                        // 선택된 영역 더블클릭 시 확대
                        if (selectionStartTime !== null && selectionEndTime !== null) {
                          setVisibleStart(Math.min(selectionStartTime, selectionEndTime))
                          setVisibleEnd(Math.max(selectionStartTime, selectionEndTime))
                        }
                      }}
                      style={{ cursor: selectionStartTime !== null && selectionEndTime !== null ? 'pointer' : 'default' }}
                    />
                  )}
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timeDisplay" stroke="#9CA3AF" label={{ value: '시간 (초)', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9CA3AF" label={{ value: 'G', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="gLat"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                  name="횡방향 G"
                />
                <Area
                  type="monotone"
                  dataKey="gLong"
                  stroke="#EC4899"
                  fill="#EC4899"
                  fillOpacity={0.3}
                  name="종방향 G"
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
       </div>
     </div>
   )
 }

// 주행 라인 시각화 컴포넌트 (정교화 버전) - 렉 방지를 위해 일시적으로 비활성화
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TrackMap({ samples, hoveredTime }: { samples: Array<{ positionX: number; positionY: number; speed: number; heading: number; throttle: number; brake: number; steering: number; time: number; index: number }>, hoveredTime: number | null }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [rotation, setRotation] = useState(0) // 회전 각도 (도)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isRotating, setIsRotating] = useState(false)
  const [rotateStart, setRotateStart] = useState({ angle: 0, x: 0, y: 0 })
  const [scrollLocked, setScrollLocked] = useState(false)

  // 스크롤 잠금 관리 (Hook은 조건부 return 이전에 호출)
  useEffect(() => {
    if (scrollLocked) {
      // 스크롤 잠금 활성화
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [scrollLocked])

  // 키보드 단축키 (화살표 키로 팬, +/-로 줌)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 20
      const zoomStep = 0.1
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setPanY(prev => prev - step)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setPanY(prev => prev + step)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setPanX(prev => prev - step)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setPanX(prev => prev + step)
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setZoom(prev => Math.min(5, prev + zoomStep))
      } else if (e.key === '-') {
        e.preventDefault()
        setZoom(prev => Math.max(0.1, prev - zoomStep))
      } else if (e.key === '0') {
        e.preventDefault()
        setZoom(1)
        setPanX(0)
        setPanY(0)
        setRotation(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // 위치 데이터가 있는 샘플만 필터링 및 정렬
  let validSamples = samples.filter(s => {
    // 유효한 위치 데이터인지 확인
    const hasValidX = s.positionX !== null && s.positionX !== undefined && !isNaN(s.positionX) && s.positionX !== 0
    const hasValidY = s.positionY !== null && s.positionY !== undefined && !isNaN(s.positionY) && s.positionY !== 0
    return hasValidX && hasValidY
  })
  
  // 시간 순서로 정렬 (elapsed_time 기준)
  validSamples = validSamples.sort((a, b) => {
    const timeA = a.time || 0
    const timeB = b.time || 0
    // 시간이 같으면 인덱스 기준 (원래 순서 유지)
    if (timeA === timeB) {
      return (a.index || 0) - (b.index || 0)
    }
    return timeA - timeB
  })
  
  // 중복 시간 제거 (같은 시간에 여러 샘플이 있는 경우 첫 번째만 유지)
  const uniqueSamples: typeof validSamples = []
  const seenTimes = new Set<number>()
  for (const sample of validSamples) {
    const time = Math.round((sample.time || 0) * 1000) / 1000 // 0.001초 단위로 반올림
    if (!seenTimes.has(time)) {
      seenTimes.add(time)
      uniqueSamples.push(sample)
    }
  }
  validSamples = uniqueSamples
  
  // 좌표 범위 계산 (이상치 제거 전에 먼저 계산)
  const initialXValues = validSamples.map(s => s.positionX)
  const initialYValues = validSamples.map(s => s.positionY)
  const initialMinX = Math.min(...initialXValues)
  const initialMaxX = Math.max(...initialXValues)
  const initialMinY = Math.min(...initialYValues)
  const initialMaxY = Math.max(...initialYValues)
  
  // 전체 트랙 크기 추정
  const trackSize = Math.sqrt(
    Math.pow(initialMaxX - initialMinX, 2) + 
    Math.pow(initialMaxY - initialMinY, 2)
  )
  
  // 이상치 제거: 연속된 점들 간의 거리가 비정상적으로 큰 경우 제거
  const cleanedSamples: typeof validSamples = []
  for (let i = 0; i < validSamples.length; i++) {
    const curr = validSamples[i]
    
    if (i === 0 || i === validSamples.length - 1) {
      // 첫 번째와 마지막은 항상 포함
      cleanedSamples.push(curr)
      continue
    }
    
    const prev = validSamples[i - 1]
    const next = validSamples[i + 1]
    
    // 이전 점과의 거리
    const distToPrev = Math.sqrt(
      Math.pow(curr.positionX - prev.positionX, 2) + 
      Math.pow(curr.positionY - prev.positionY, 2)
    )
    
    // 다음 점과의 거리
    const distToNext = Math.sqrt(
      Math.pow(next.positionX - curr.positionX, 2) + 
      Math.pow(next.positionY - curr.positionY, 2)
    )
    
    // 평균 거리 계산
    const avgDist = (distToPrev + distToNext) / 2
    
    // 시간 차이도 고려 (속도 기반 임계값)
    const timeToPrev = (curr.time || 0) - (prev.time || 0)
    const timeToNext = (next.time || 0) - (curr.time || 0)
    const avgTime = (timeToPrev + timeToNext) / 2
    
    // 속도 추정 (m/s)
    const estimatedSpeed = avgTime > 0 ? avgDist / avgTime : 0
    
    // 임계값: 트랙 크기의 5% 또는 100m 중 큰 값
    const threshold = Math.max(trackSize * 0.05, 100)
    
    // 평균 거리가 임계값보다 크고, 속도가 비정상적으로 빠른 경우 이상치로 간주
    if (avgDist < threshold || (estimatedSpeed > 0 && estimatedSpeed < 150)) { // 150 m/s = 540 km/h 이하면 정상
      cleanedSamples.push(curr)
    } else {
      // 이상치는 제외하되 로그 출력
      console.warn(`이상치 제거: 인덱스 ${i}, 거리 ${avgDist.toFixed(2)}m, 속도 ${(estimatedSpeed * 3.6).toFixed(1)} km/h`)
    }
  }
  
  validSamples = cleanedSamples
  
  // 유효한 샘플이 있는지 확인 (Hook 호출 전에)
  if (validSamples.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p>위치 데이터가 없습니다</p>
        </div>
      </div>
    )
  }
  
  // cleanedSamples 기준으로 좌표 범위 재계산
  const cleanedXValues = validSamples.map(s => s.positionX)
  const cleanedYValues = validSamples.map(s => s.positionY)
  const minX = Math.min(...cleanedXValues)
  const maxX = Math.max(...cleanedXValues)
  const minY = Math.min(...cleanedYValues)
  const maxY = Math.max(...cleanedYValues)
  
  // hoveredTime에 해당하는 샘플 찾기 (chartData에서 직접 찾기)
  const getSampleByTime = (time: number | null) => {
    if (time === null) return null
    // chartData (samples prop)에서 가장 가까운 시간의 샘플 찾기
    if (samples.length === 0) return null
    
    let closestSample = samples[0]
    let minDiff = Math.abs((closestSample.time || 0) - time)
    
    for (const sample of samples) {
      const diff = Math.abs((sample.time || 0) - time)
      if (diff < minDiff) {
        minDiff = diff
        closestSample = sample
      }
    }
    return minDiff < 1.0 ? closestSample : null // 1초 이내 차이만 허용
  }
  
  const hoveredSample = hoveredTime !== null ? getSampleByTime(hoveredTime) : null

  // 여백 추가
  const padding = 80
  const width = 1200
  const height = 600
  const centerX = width / 2
  const centerY = height / 2
  
  // 중심점 계산 (트랙 중심)
  const trackCenterX = (minX + maxX) / 2
  const trackCenterY = (minY + maxY) / 2
  
  const scaleX = (width - padding * 2) / (maxX - minX || 1)
  const scaleY = (height - padding * 2) / (maxY - minY || 1)
  const baseScale = Math.min(scaleX, scaleY) // 종횡비 유지
  const finalScale = baseScale * zoom

  // 좌표 변환 함수 (줌/팬/회전 적용)
  const transformPoint = (x: number, y: number) => {
    // 1. 트랙 중심을 원점으로 이동
    const dx = x - trackCenterX
    const dy = y - trackCenterY
    
    // 2. 회전 적용 (라디안)
    const rad = (rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const rotatedX = dx * cos - dy * sin
    const rotatedY = dx * sin + dy * cos
    
    // 3. 스케일 적용
    const scaledX = rotatedX * finalScale
    const scaledY = rotatedY * finalScale
    
    // 4. 화면 중심으로 이동 + 팬
    return {
      x: centerX + scaledX + panX,
      y: centerY + scaledY + panY
    }
  }
  

  // 속도 통계 계산
  const speeds = validSamples.map(s => s.speed)
  const maxSpeed = Math.max(...speeds)
  const minSpeed = Math.min(...speeds)
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length

  // 속도에 따른 색상 계산 (더 정교한 그라데이션)
  const getSpeedColor = (speed: number) => {
    const ratio = (speed - minSpeed) / (maxSpeed - minSpeed || 1)
    
    // 더 부드러운 색상 그라데이션
    if (ratio > 0.9) return '#DC2626' // 매우 빠름 (빨강)
    if (ratio > 0.75) return '#EF4444' // 빠름 (밝은 빨강)
    if (ratio > 0.6) return '#F59E0B' // 보통 빠름 (주황)
    if (ratio > 0.45) return '#FCD34D' // 보통 (노랑)
    if (ratio > 0.3) return '#10B981' // 보통 느림 (초록)
    if (ratio > 0.15) return '#3B82F6' // 느림 (파랑)
    return '#6366F1' // 매우 느림 (보라)
  }

  // 속도 변화율 계산 (가속/감속 감지)
  const calculateAcceleration = (index: number) => {
    if (index === 0 || index >= validSamples.length - 1) return 0
    const prev = validSamples[index - 1]
    const next = validSamples[index + 1]
    return (next.speed - prev.speed) / 2
  }

  // 코너 감지 (방향 변화율이 큰 구간)
  const detectCorners = () => {
    const corners: number[] = []
    for (let i = 1; i < validSamples.length - 1; i++) {
      const prev = validSamples[i - 1]
      const curr = validSamples[i]
      const next = validSamples[i + 1]
      
      const angle1 = Math.atan2(curr.positionY - prev.positionY, curr.positionX - prev.positionX)
      const angle2 = Math.atan2(next.positionY - curr.positionY, next.positionX - curr.positionX)
      const angleDiff = Math.abs(angle2 - angle1)
      const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff)
      
      // 방향 변화가 30도 이상이면 코너로 간주
      if (normalizedDiff > Math.PI / 6) {
        corners.push(i)
      }
    }
    return corners
  }

  const corners = detectCorners()

  // 경로 포인트 생성 (정교화) - 회전/줌/팬 적용
  const pathPoints = validSamples.map((sample, index) => {
    const transformed = transformPoint(sample.positionX, sample.positionY)
    const acceleration = calculateAcceleration(index)
    const isCorner = corners.includes(index)
    
    return { 
      x: transformed.x, 
      y: transformed.y, 
      color: getSpeedColor(sample.speed), 
      speed: sample.speed, 
      heading: sample.heading,
      throttle: sample.throttle || 0,
      brake: sample.brake || 0,
      steering: sample.steering || 0,
      acceleration,
      isCorner,
      index: sample.index // 원본 samples 배열의 인덱스
    }
  })
  
  // 선택된 샘플 또는 호버된 샘플 또는 마지막 샘플
  // selectedIndex는 pathPoints의 인덱스이므로, validSamples의 인덱스와 일치
  let currentSample = null
  if (hoveredSample) {
    currentSample = hoveredSample
  } else if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < pathPoints.length) {
    // pathPoints[selectedIndex]의 index를 사용하여 samples에서 찾기
    const pathPoint = pathPoints[selectedIndex]
    if (pathPoint) {
      const sampleIndex = pathPoint.index
      if (sampleIndex >= 0 && sampleIndex < samples.length) {
        currentSample = samples[sampleIndex]
      }
    }
  }
  
  // currentSample이 없으면 마지막 샘플 사용
  if (!currentSample && samples.length > 0) {
    currentSample = samples[samples.length - 1]
  }

  // 베지어 곡선 경로 생성 (부드러운 곡선, 역방향 감지)
  const generateSmoothPath = () => {
    if (pathPoints.length < 2) return ''
    
    let path = `M ${pathPoints[0].x} ${pathPoints[0].y}`
    
    for (let i = 1; i < pathPoints.length; i++) {
      const prev = pathPoints[i - 1]
      const curr = pathPoints[i]
      
      // 이전 점과의 거리 계산
      const dist = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + 
        Math.pow(curr.y - prev.y, 2)
      )
      
      // 거리가 너무 크면 (이상치) 직선으로 연결하지 않고 스킵
      const maxDist = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)) * 0.1
      if (dist > maxDist) {
        // 다음 점으로 이동 (새로운 시작점)
        path += ` M ${curr.x} ${curr.y}`
        continue
      }
      
      if (i === 1) {
        // 첫 번째 점은 선으로
        path += ` L ${curr.x} ${curr.y}`
      } else {
        const next = i < pathPoints.length - 1 ? pathPoints[i + 1] : curr
        
        // 다음 점과의 거리도 확인
        const nextDist = Math.sqrt(
          Math.pow(next.x - curr.x, 2) + 
          Math.pow(next.y - curr.y, 2)
        )
        
        if (nextDist > maxDist) {
          // 다음 점이 너무 멀면 직선으로 연결
          path += ` L ${curr.x} ${curr.y}`
          continue
        }
        
        // 제어점 계산 (이전/다음 점의 중간, 더 보수적으로)
        const smoothness = 0.3 // 0.5에서 0.3으로 줄여서 더 직선에 가깝게
        const cp1x = prev.x + (curr.x - prev.x) * smoothness
        const cp1y = prev.y + (curr.y - prev.y) * smoothness
        const cp2x = curr.x - (next.x - curr.x) * smoothness
        const cp2y = curr.y - (next.y - curr.y) * smoothness
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
      }
    }
    
    return path
  }

  // 트랙 경계선 생성 (주행 라인 기준 오프셋) - 사용되지 않음, generateTrackBoundariesAdvanced 사용
  // const generateTrackBoundaries = (offset: number) => {
  //   if (pathPoints.length < 2) return { left: '', right: '' }
  //   ...
  // }

  // 트랙 폭 계산 (VRS/TrackTitan 스타일 - 다중 랩 데이터 기반)
  const estimateTrackWidth = () => {
    // 주행 라인의 변동성을 계산 (표준 편차 기반)
    // 하지만 꼬임 방지를 위해 더 간단한 방법 사용
    
    // 주행 라인을 따라 이동하면서 인접한 점들 간의 수직 거리 계산
    const perpendicularDistances: number[] = []
    
    for (let i = 1; i < validSamples.length - 1; i++) {
      const prev = validSamples[i - 1]
      const curr = validSamples[i]
      const next = validSamples[i + 1]
      
      // 방향 벡터 계산
      const dx = next.positionX - prev.positionX
      const dy = next.positionY - prev.positionY
      const length = Math.sqrt(dx * dx + dy * dy)
      
      if (length === 0) continue
      
      // 현재 점에서 방향 벡터까지의 거리 (수직 거리)
      const toCurrX = curr.positionX - prev.positionX
      const toCurrY = curr.positionY - prev.positionY
      
      // 벡터 투영
      const dot = (toCurrX * dx + toCurrY * dy) / (length * length)
      const projX = prev.positionX + dot * dx
      const projY = prev.positionY + dot * dy
      
      // 수직 거리
      const perpDist = Math.sqrt(
        Math.pow(curr.positionX - projX, 2) + 
        Math.pow(curr.positionY - projY, 2)
      )
      
      perpendicularDistances.push(perpDist)
    }
    
    // 평균 수직 거리를 기반으로 트랙 폭 추정
    if (perpendicularDistances.length === 0) {
      // 대체 방법: 전체 범위 기반
      const maxRange = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2))
      return Math.max(50, maxRange / 20)
    }
    
    const avgPerpDist = perpendicularDistances.reduce((a, b) => a + b, 0) / perpendicularDistances.length
    const maxPerpDist = Math.max(...perpendicularDistances)
    
    // 트랙 폭 = 평균 수직 거리의 4배 (좌우 각각 2배)
    const trackWidth = Math.max(50, Math.min(avgPerpDist * 4, maxPerpDist * 2))
    
    return trackWidth
  }

  // 트랙 경계선 생성 (더 정교한 방법)
  const generateTrackBoundariesAdvanced = (halfWidth: number) => {
    if (pathPoints.length < 2) return { left: '', right: '' }
    
    const leftPoints: { x: number; y: number }[] = []
    const rightPoints: { x: number; y: number }[] = []
    
    // 이전 방향 벡터 저장 (연속성 유지)
    let prevDirX = 0
    let prevDirY = 1
    
    for (let i = 0; i < pathPoints.length; i++) {
      const curr = pathPoints[i]
      let dirX, dirY, length
      
      // 방향 벡터 계산 (더 안정적인 방법)
      if (i === 0) {
        // 첫 번째 점: 다음 점 방향 사용
        const next = pathPoints[Math.min(i + 1, pathPoints.length - 1)]
        dirX = next.x - curr.x
        dirY = next.y - curr.y
        length = Math.sqrt(dirX * dirX + dirY * dirY)
      } else if (i === pathPoints.length - 1) {
        // 마지막 점: 이전 점 방향 사용
        const prev = pathPoints[Math.max(i - 1, 0)]
        dirX = curr.x - prev.x
        dirY = curr.y - prev.y
        length = Math.sqrt(dirX * dirX + dirY * dirY)
      } else {
        // 중간 점: 이전과 다음 점의 평균 방향 사용
        const prev = pathPoints[i - 1]
        const next = pathPoints[i + 1]
        
        // 이전 방향
        const dir1X = curr.x - prev.x
        const dir1Y = curr.y - prev.y
        const len1 = Math.sqrt(dir1X * dir1X + dir1Y * dir1Y)
        
        // 다음 방향
        const dir2X = next.x - curr.x
        const dir2Y = next.y - curr.y
        const len2 = Math.sqrt(dir2X * dir2X + dir2Y * dir2Y)
        
        // 정규화 후 평균
        if (len1 > 0 && len2 > 0) {
          dirX = (dir1X / len1 + dir2X / len2) / 2
          dirY = (dir1Y / len1 + dir2Y / len2) / 2
          length = Math.sqrt(dirX * dirX + dirY * dirY)
          
          // 정규화
          if (length > 0) {
            dirX /= length
            dirY /= length
          }
        } else if (len1 > 0) {
          dirX = dir1X / len1
          dirY = dir1Y / len1
          length = 1
        } else if (len2 > 0) {
          dirX = dir2X / len2
          dirY = dir2Y / len2
          length = 1
        } else {
          // 이전 방향 사용
          dirX = prevDirX
          dirY = prevDirY
          length = 1
        }
      }
      
      // 길이가 0이거나 너무 작으면 이전 방향 사용
      if (length < 0.001) {
        dirX = prevDirX
        dirY = prevDirY
        length = 1
      } else {
        // 방향 벡터 정규화
        dirX /= length
        dirY /= length
        // 다음 반복을 위해 저장
        prevDirX = dirX
        prevDirY = dirY
      }
      
      // 수직 벡터 계산 (왼쪽/오른쪽) - 90도 회전
      const perpX = -dirY
      const perpY = dirX
      
      // 오프셋 적용 (트랙 폭의 절반)
      leftPoints.push({
        x: curr.x + perpX * halfWidth,
        y: curr.y + perpY * halfWidth
      })
      rightPoints.push({
        x: curr.x - perpX * halfWidth,
        y: curr.y - perpY * halfWidth
      })
    }
    
    // 부드러운 경로 생성 (베지어 곡선, 거리 기반 이상치 감지)
    const generateSmoothBoundaryPath = (points: { x: number; y: number }[]) => {
      if (points.length < 2) return ''
      
      let path = `M ${points[0].x} ${points[0].y}`
      const maxDist = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)) * 0.15
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        
        // 이전 점과의 거리 확인
        const dist = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + 
          Math.pow(curr.y - prev.y, 2)
        )
        
        // 거리가 너무 크면 새로운 시작점으로
        if (dist > maxDist) {
          path += ` M ${curr.x} ${curr.y}`
          continue
        }
        
        if (i === 1) {
          path += ` L ${curr.x} ${curr.y}`
        } else {
          const next = i < points.length - 1 ? points[i + 1] : curr
          
          // 다음 점과의 거리도 확인
          const nextDist = Math.sqrt(
            Math.pow(next.x - curr.x, 2) + 
            Math.pow(next.y - curr.y, 2)
          )
          
          if (nextDist > maxDist) {
            path += ` L ${curr.x} ${curr.y}`
            continue
          }
          
          // 제어점 계산 (더 보수적으로)
          const smoothness = 0.3
          const cp1x = prev.x + (curr.x - prev.x) * smoothness
          const cp1y = prev.y + (curr.y - prev.y) * smoothness
          const cp2x = curr.x - (next.x - curr.x) * smoothness
          const cp2y = curr.y - (next.y - curr.y) * smoothness
          
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
        }
      }
      
      return path
    }
    
    return {
      left: generateSmoothBoundaryPath(leftPoints),
      right: generateSmoothBoundaryPath(rightPoints)
    }
  }

  const trackWidth = estimateTrackWidth()
  const trackBoundaries = generateTrackBoundariesAdvanced(trackWidth / 2)

  // 최고 속도 지점 찾기
  const maxSpeedIndex = validSamples.findIndex(s => s.speed === maxSpeed)
  const maxSpeedPoint = maxSpeedIndex >= 0 ? pathPoints[maxSpeedIndex] : null

  // 랩 구간 감지 (시작점과 가까운 점 찾기)
  const findLapMarkers = () => {
    if (validSamples.length < 100) return []
    
    const startPoint = validSamples[0]
    const markers: number[] = []
    
    // 시작점과 가까운 점들을 찾아서 랩 마커로 표시
    for (let i = 50; i < validSamples.length; i++) {
      const dist = Math.sqrt(
        Math.pow(validSamples[i].positionX - startPoint.positionX, 2) +
        Math.pow(validSamples[i].positionY - startPoint.positionY, 2)
      )
      if (dist < (maxX - minX) * 0.05) {
        markers.push(i)
      }
    }
    
    return markers
  }

  const lapMarkers = findLapMarkers()

  // 마우스 휠 줌 핸들러
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)))
  }

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.ctrlKey && !e.shiftKey) { // 왼쪽 버튼 (일반 드래그)
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    } else if (e.button === 2 || (e.ctrlKey && e.button === 0)) { // 우클릭 또는 Ctrl+좌클릭 (회전)
      e.preventDefault()
        setIsRotating(true)
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          const mouseX = e.clientX - rect.left
          const mouseY = e.clientY - rect.top
          setRotateStart({ angle: rotation, x: mouseX, y: mouseY })
        }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    } else if (isRotating) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const centerX_rel = centerX
        const centerY_rel = centerY
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const currentAngle = Math.atan2(mouseY - centerY_rel, mouseX - centerX_rel) * (180 / Math.PI)
        const startAngle = Math.atan2(rotateStart.y - centerY_rel, rotateStart.x - centerX_rel) * (180 / Math.PI)
        setRotation(rotateStart.angle + (currentAngle - startAngle))
      }
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsRotating(false)
  }

  return (
    <div className="relative w-full h-full">
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      className={`bg-gray-950 rounded-lg cursor-grab active:cursor-grabbing ${scrollLocked ? 'select-none' : ''}`}
      preserveAspectRatio="xMidYMid meet"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={0}
      onFocus={() => {
        // SVG에 포커스가 있을 때만 휠 이벤트 처리
      }}
    >
      {/* 그리드 */}
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1F2937" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* 트랙 형상 (바닥) */}
      <defs>
        {/* 트랙 바닥 그라데이션 */}
        <linearGradient id="trackSurface" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2D3748" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#1A202C" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#171923" stopOpacity="0.8" />
        </linearGradient>
        
        {/* 트랙 경계선 패턴 */}
        <pattern id="trackLines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="20" y2="10" stroke="#4A5568" strokeWidth="0.5" opacity="0.3" />
        </pattern>
      </defs>

      {/* 트랙 영역 (폐곡선) - 주행 라인 기준 양쪽 경계선 */}
      {trackBoundaries.left && trackBoundaries.right && (
        <path
          d={`${trackBoundaries.left} ${trackBoundaries.right.split(' ').slice(1).reverse().join(' ')} Z`}
          fill="url(#trackSurface)"
          opacity="0.4"
          className="pointer-events-none"
        />
      )}

      {/* 트랙 바닥 텍스처 (패턴) */}
      {trackBoundaries.left && trackBoundaries.right && (
        <path
          d={`${trackBoundaries.left} ${trackBoundaries.right.split(' ').slice(1).reverse().join(' ')} Z`}
          fill="url(#trackLines)"
          opacity="0.2"
          className="pointer-events-none"
        />
      )}

      {/* 트랙 중앙선 (주행 라인 기준) */}
      <path
        d={generateSmoothPath()}
        fill="none"
        stroke="#FCD34D"
        strokeWidth="2"
        strokeDasharray="15,10"
        opacity="0.4"
        className="pointer-events-none"
      />

      {/* 트랙 경계선 (안쪽) - VRS 스타일 */}
      {trackBoundaries.left && (
        <path
          d={trackBoundaries.left}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2.5"
          strokeDasharray="8,4"
          opacity="0.6"
          strokeLinecap="round"
        />
      )}

      {/* 트랙 경계선 (바깥쪽) - VRS 스타일 */}
      {trackBoundaries.right && (
        <path
          d={trackBoundaries.right}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="2.5"
          strokeDasharray="8,4"
          opacity="0.6"
          strokeLinecap="round"
        />
      )}

      {/* 트랙 경계선 강조 (코너 구간) */}
      {corners.map((cornerIdx) => {
        const cornerPoint = pathPoints[cornerIdx]
        if (!cornerPoint || !trackBoundaries.left || !trackBoundaries.right) return null
        
        // 코너 구간의 경계선 강조
        const startIdx = Math.max(0, cornerIdx - 5)
        const endIdx = Math.min(pathPoints.length - 1, cornerIdx + 5)
        
        return (
          <g key={`corner-boundary-${cornerIdx}`} opacity="0.8">
            <path
              d={trackBoundaries.left.split(' ').slice(startIdx * 3, endIdx * 3).join(' ')}
              fill="none"
              stroke="#FCD34D"
              strokeWidth="3"
              opacity="0.7"
            />
            <path
              d={trackBoundaries.right.split(' ').slice(startIdx * 3, endIdx * 3).join(' ')}
              fill="none"
              stroke="#FCD34D"
              strokeWidth="3"
              opacity="0.7"
            />
          </g>
        )
      })}

      {/* 부드러운 주행 라인 (베지어 곡선) */}
      <defs>
        {/* 그라데이션 정의 (속도별) */}
        <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {pathPoints.map((point, idx) => {
            const offset = (idx / (pathPoints.length - 1)) * 100
            return (
              <stop key={idx} offset={`${offset}%`} stopColor={point.color} />
            )
          })}
        </linearGradient>
        
        {/* 그림자 필터 */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="2" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* 주행 라인 (부드러운 곡선) - 메인 */}
      <path
        d={generateSmoothPath()}
        fill="none"
        stroke="url(#trackGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
        filter="url(#shadow)"
        onMouseMove={(e) => {
          // 호버 시 가장 가까운 포인트 찾기
          const rect = svgRef.current?.getBoundingClientRect()
          if (!rect) return
          
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          
          // 가장 가까운 포인트 찾기
          let minDist = Infinity
          let closestIdx = null
          
          pathPoints.forEach((point, idx) => {
            const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2))
            if (dist < minDist && dist < 20) {
              minDist = dist
              closestIdx = idx
            }
          })
          
          if (closestIdx !== null) {
            setSelectedIndex(pathPoints[closestIdx].index)
          }
        }}
        onMouseLeave={() => setSelectedIndex(null)}
        className="cursor-pointer"
      />

      {/* 코너 구간 강조 */}
      {corners.map((cornerIdx) => {
        const point = pathPoints[cornerIdx]
        if (!point) return null
        return (
          <circle
            key={`corner-${cornerIdx}`}
            cx={point.x}
            cy={point.y}
            r="8"
            fill="none"
            stroke="#FCD34D"
            strokeWidth="2"
            opacity="0.7"
          />
        )
      })}

      {/* 최고 속도 지점 표시 */}
      {maxSpeedPoint && (
        <g>
          <circle
            cx={maxSpeedPoint.x}
            cy={maxSpeedPoint.y}
            r="12"
            fill="#DC2626"
            stroke="#fff"
            strokeWidth="2"
            opacity="0.9"
          />
          <text
            x={maxSpeedPoint.x}
            y={maxSpeedPoint.y - 20}
            fill="#fff"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            className="pointer-events-none"
          >
            {maxSpeed.toFixed(0)} km/h
          </text>
        </g>
      )}

      {/* 랩 마커 (시작점과 가까운 지점) */}
      {lapMarkers.map((markerIdx) => {
        const point = pathPoints[markerIdx]
        if (!point) return null
        return (
          <g key={`lap-${markerIdx}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="10"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.8"
            />
            <text
              x={point.x}
              y={point.y - 25}
              fill="#10B981"
              fontSize="11"
              fontWeight="bold"
              textAnchor="middle"
              className="pointer-events-none"
            >
              LAP
            </text>
          </g>
        )
      })}

      {/* 현재 차량 위치/지점 표시 (항상 표시) */}
      {(() => {
        // currentSample에 해당하는 포인트 찾기
        let activePoint = null
        if (currentSample) {
          // currentSample의 index를 사용하여 pathPoints에서 찾기
          const pathPointIdx = pathPoints.findIndex(p => p.index === currentSample.index)
          if (pathPointIdx >= 0 && pathPoints[pathPointIdx]) {
            activePoint = pathPoints[pathPointIdx]
          } else {
            // pathPoints에 없으면 직접 좌표 변환
            if (currentSample.positionX !== 0 || currentSample.positionY !== 0) {
              const transformed = transformPoint(currentSample.positionX, currentSample.positionY)
              activePoint = {
                x: transformed.x,
                y: transformed.y,
                heading: currentSample.heading || 0,
                index: currentSample.index
              }
            }
          }
        }
        
        // activePoint가 없으면 마지막 포인트 사용
        if (!activePoint && pathPoints.length > 0) {
          activePoint = pathPoints[pathPoints.length - 1]
        }
        
        if (!activePoint) return null
        
        // 회전이 적용된 상태에서 heading도 회전만큼 조정
        const headingDeg = (activePoint.heading || 0) + rotation
        const isHovered = hoveredSample !== null
        
        return (
          <g transform={`translate(${activePoint.x}, ${activePoint.y}) rotate(${headingDeg})`}>
            {/* 외곽 글로우 */}
            <circle 
              r={isHovered ? "18" : "12"} 
              fill="none" 
              stroke={isHovered ? "#fbbf24" : "#22d3ee"} 
              strokeWidth={isHovered ? "5" : "4"} 
              opacity={isHovered ? "0.7" : "0.4"}
              className={isHovered ? "animate-pulse" : ""}
            />
            {/* 차량 포인터 (삼각형) - 진행 방향 */}
            <polygon 
              points="0,-16 10,12 -10,12" 
              fill={isHovered ? "#fbbf24" : "#22d3ee"} 
              opacity="0.95"
              stroke={isHovered ? "#fff" : "none"}
              strokeWidth="2"
            />
            {/* 중심점 */}
            <circle r="4" fill={isHovered ? "#f59e0b" : "#0ea5e9"} />
          </g>
        )
      })()}

      {/* 시작 지점 표시 */}
      {pathPoints[0] && (
        <circle
          cx={pathPoints[0].x}
          cy={pathPoints[0].y}
          r="8"
          fill="#10B981"
          stroke="#fff"
          strokeWidth="2"
        />
      )}

      {/* 종료 지점 표시 */}
      {pathPoints[pathPoints.length - 1] && (
        <circle
          cx={pathPoints[pathPoints.length - 1].x}
          cy={pathPoints[pathPoints.length - 1].y}
          r="8"
          fill="#EF4444"
          stroke="#fff"
          strokeWidth="2"
        />
      )}

      {/* 속도 벡터 제거 - 깔끔한 주행 라인을 위해 */}

      {/* 줌/팬 컨트롤 UI */}
      <g transform={`translate(20, 20)`}>
        <rect x="0" y="0" width="140" height="140" fill="#1F2937" fillOpacity="0.95" rx="8" />
        <text x="10" y="20" fill="#fff" fontSize="12" fontWeight="bold">컨트롤</text>
        <text x="10" y="35" fill="#9CA3AF" fontSize="9">휠: 줌</text>
        <text x="10" y="50" fill="#9CA3AF" fontSize="9">드래그: 팬</text>
        <text x="10" y="65" fill="#9CA3AF" fontSize="9">우클릭+드래그: 회전</text>
        <text x="10" y="80" fill="#9CA3AF" fontSize="9">화살표: 이동</text>
        <text x="10" y="95" fill="#9CA3AF" fontSize="9">+/-: 줌</text>
        <text x="10" y="110" fill="#9CA3AF" fontSize="9">0: 리셋</text>
        
        {/* 스크롤 잠금 버튼 */}
        <g 
          onClick={() => setScrollLocked(!scrollLocked)}
          className="cursor-pointer"
        >
          <rect x="10" y="120" width="120" height="15" fill={scrollLocked ? "#10B981" : "#374151"} fillOpacity="0.8" rx="4" />
          <text x="70" y="131" fill="#fff" fontSize="10" textAnchor="middle">
            {scrollLocked ? "🔒 스크롤 잠금" : "🔓 스크롤 잠금"}
          </text>
        </g>
      </g>

      {/* 나침반 */}
      <g transform={`translate(${width - 100}, 20)`}>
        <circle cx="40" cy="40" r="35" fill="#1F2937" fillOpacity="0.95" stroke="#60A5FA" strokeWidth="2" />
        <text x="40" y="20" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">N</text>
        
        {/* 회전된 나침반 */}
        <g transform={`translate(40, 40) rotate(${rotation})`}>
          {/* 북쪽 화살표 */}
          <polygon points="0,-25 8,10 -8,10" fill="#EF4444" opacity="0.9" />
          <line x1="0" y1="-25" x2="0" y2="10" stroke="#fff" strokeWidth="2" />
          
          {/* 남쪽 화살표 */}
          <polygon points="0,25 8,-10 -8,-10" fill="#60A5FA" opacity="0.5" />
          
          {/* 동서 표시 */}
          <line x1="-25" y1="0" x2="25" y2="0" stroke="#9CA3AF" strokeWidth="1" />
          <text x="25" y="5" fill="#9CA3AF" fontSize="9">E</text>
          <text x="-30" y="5" fill="#9CA3AF" fontSize="9">W</text>
        </g>
        
        {/* 회전 각도 표시 */}
        <text x="40" y="90" fill="#9CA3AF" fontSize="10" textAnchor="middle">
          {rotation.toFixed(0)}°
        </text>
        
        {/* 줌 레벨 표시 */}
        <text x="40" y="105" fill="#9CA3AF" fontSize="10" textAnchor="middle">
          {(zoom * 100).toFixed(0)}%
        </text>
      </g>

      {/* 줌/리셋 버튼 */}
      <g transform={`translate(${width - 100}, 220)`}>
        <rect x="0" y="0" width="80" height="100" fill="#1F2937" fillOpacity="0.95" rx="8" />
        <text x="40" y="20" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">줌</text>
        
        {/* 줌 인 버튼 */}
        <g 
          onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
          className="cursor-pointer"
        >
          <rect x="10" y="30" width="60" height="25" fill="#10B981" fillOpacity="0.7" rx="4" />
          <text x="40" y="47" fill="#fff" fontSize="12" textAnchor="middle">+</text>
        </g>
        
        {/* 줌 아웃 버튼 */}
        <g 
          onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))}
          className="cursor-pointer"
        >
          <rect x="10" y="60" width="60" height="25" fill="#EF4444" fillOpacity="0.7" rx="4" />
          <text x="40" y="77" fill="#fff" fontSize="12" textAnchor="middle">-</text>
        </g>
        
        {/* 리셋 버튼 */}
        <g 
          onClick={() => {
            setZoom(1)
            setPanX(0)
            setPanY(0)
            setRotation(0)
          }}
          className="cursor-pointer"
        >
          <rect x="10" y="90" width="60" height="25" fill="#F59E0B" fillOpacity="0.7" rx="4" />
          <text x="40" y="107" fill="#fff" fontSize="10" textAnchor="middle">리셋</text>
        </g>
      </g>

      {/* 범례 및 통계 */}
      <g transform={`translate(${width - 220}, 160)`}>
        <rect x="0" y="0" width="200" height="180" fill="#1F2937" fillOpacity="0.95" rx="8" />
        <text x="10" y="20" fill="#fff" fontSize="13" fontWeight="bold">속도 범례</text>
        
        {/* 속도 범례 (개선) */}
        <line x1="10" y1="30" x2="30" y2="30" stroke="#DC2626" strokeWidth="3" />
        <text x="35" y="35" fill="#9CA3AF" fontSize="9">매우 빠름 (&gt;90%)</text>
        <line x1="10" y1="48" x2="30" y2="48" stroke="#F59E0B" strokeWidth="3" />
        <text x="35" y="53" fill="#9CA3AF" fontSize="9">빠름 (60-90%)</text>
        <line x1="10" y1="66" x2="30" y2="66" stroke="#FCD34D" strokeWidth="3" />
        <text x="35" y="71" fill="#9CA3AF" fontSize="9">보통 (45-60%)</text>
        <line x1="10" y1="84" x2="30" y2="84" stroke="#10B981" strokeWidth="3" />
        <text x="35" y="89" fill="#9CA3AF" fontSize="9">느림 (30-45%)</text>
        <line x1="10" y1="102" x2="30" y2="102" stroke="#3B82F6" strokeWidth="3" />
        <text x="35" y="107" fill="#9CA3AF" fontSize="9">매우 느림 (&lt;30%)</text>
        
        {/* 마커 범례 */}
        <circle cx="15" cy="120" r="6" fill="#10B981" stroke="#fff" strokeWidth="1" />
        <text x="25" y="125" fill="#9CA3AF" fontSize="9">시작</text>
        <circle cx="95" cy="120" r="6" fill="#EF4444" stroke="#fff" strokeWidth="1" />
        <text x="105" y="125" fill="#9CA3AF" fontSize="9">종료</text>
        <circle cx="15" cy="138" r="6" fill="none" stroke="#FCD34D" strokeWidth="2" />
        <text x="25" y="143" fill="#9CA3AF" fontSize="9">코너</text>
        <circle cx="95" cy="138" r="6" fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="5,5" />
        <text x="105" y="143" fill="#9CA3AF" fontSize="9">랩</text>
        
        {/* 통계 정보 */}
        <text x="10" y="160" fill="#60A5FA" fontSize="10" fontWeight="bold">속도 통계</text>
        <text x="10" y="175" fill="#9CA3AF" fontSize="9">
          최대: {maxSpeed.toFixed(0)} km/h | 평균: {avgSpeed.toFixed(0)} km/h | 최소: {minSpeed.toFixed(0)} km/h
        </text>
      </g>
    </svg>

    {/* 입력 게이지 HUD - 오른쪽 하단 */}
    {currentSample && (
      <div className="absolute bottom-6 right-6 flex items-end gap-4 z-10">
        {/* 스로틀 바 */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-1 font-semibold">스로틀</div>
          <div className="relative w-14 h-56 bg-gray-900/90 rounded-lg border-2 border-gray-700 overflow-hidden backdrop-blur-sm">
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-green-600 via-green-500 to-green-400 transition-all duration-100 shadow-lg shadow-green-500/50"
              style={{ height: `${currentSample.throttle}%` }}
            />
            <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
              {[0, 25, 50, 75, 100].map((val) => (
                <div key={val} className="text-[9px] text-gray-500 text-center font-medium">{val}%</div>
              ))}
            </div>
            {/* 현재 값 표시 */}
            <div className="absolute top-1 left-0 right-0 text-center text-xs font-bold text-white">
              {currentSample.throttle.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* 브레이크 바 */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-1 font-semibold">브레이크</div>
          <div className="relative w-14 h-56 bg-gray-900/90 rounded-lg border-2 border-gray-700 overflow-hidden backdrop-blur-sm">
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 via-red-500 to-red-400 transition-all duration-100 shadow-lg shadow-red-500/50"
              style={{ height: `${currentSample.brake}%` }}
            />
            <div className="absolute inset-0 flex flex-col justify-between p-1.5 pointer-events-none">
              {[0, 25, 50, 75, 100].map((val) => (
                <div key={val} className="text-[9px] text-gray-500 text-center font-medium">{val}%</div>
              ))}
            </div>
            {/* 현재 값 표시 */}
            <div className="absolute top-1 left-0 right-0 text-center text-xs font-bold text-white">
              {currentSample.brake.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* 스티어링 휠 */}
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-1 font-semibold">스티어링</div>
          <div className="relative w-36 h-36">
            {/* 스티어링 휠 배경 */}
            <div className="absolute inset-0 rounded-full bg-gray-900/90 border-4 border-gray-700 backdrop-blur-sm" />
            {/* 스티어링 휠 */}
            <div 
              className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border-3 border-gray-600 transition-transform duration-100 shadow-xl"
              style={{ 
                transform: `rotate(${currentSample.steering * 540}deg)`, // 스티어링은 -1.0 ~ 1.0 범위를 -540 ~ 540도로 변환
                transformOrigin: 'center'
              }}
            >
              {/* 휠 그립 표시 (4방향) */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-gray-400 rounded-full" />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-gray-400 rounded-full" />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-1.5 bg-gray-400 rounded-full" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-1.5 bg-gray-400 rounded-full" />
              {/* 추가 그립 (대각선) */}
              <div className="absolute top-3 left-3 w-2 h-2 bg-gray-500 rounded-full" />
              <div className="absolute top-3 right-3 w-2 h-2 bg-gray-500 rounded-full" />
              <div className="absolute bottom-3 left-3 w-2 h-2 bg-gray-500 rounded-full" />
              <div className="absolute bottom-3 right-3 w-2 h-2 bg-gray-500 rounded-full" />
            </div>
            {/* 중앙 표시 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
            </div>
            {/* 스티어링 각도 표시 (도) */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-gray-300 whitespace-nowrap font-semibold">
              {(currentSample.steering * 180).toFixed(1)}°
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

