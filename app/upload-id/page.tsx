'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceArea, 
} from 'recharts'
import { PostgrestResponse } from '@supabase/supabase-js'
import Image from 'next/image'
import GearSpeedCircle from '@/components/GearSpeedCircle'
import RPMShiftLight from '@/components/RPMShiftLight'
import TimerDisplay from '@/components/TimerDisplay'
import { API_URL } from '@/lib/constants'

interface CornerEntryFeedback {
  start_idx: number 
  end_idx: number
  corner_index: number
  feedback: string
  avg_brake_pressure: number
  brake_duration: number
  steer_variability: number
}

interface CornerExitFeedback {
  start_idx: number 
  end_idx: number
  corner_index: number
  feedback: string
  max_slip_ratio: number
}

interface SectorResult {
  sector_index: number
  duration: number
  avg_speed: number
  // 필요에 따라 필드 추가 가능
}

interface ResultType {
  track: string
  car: string
  data?: Array<Record<string, number>>
  sector_results?: SectorResult[]        
  corner_exit_analysis: CornerExitFeedback[] 
  corner_entry_analysis?: CornerEntryFeedback[]
}

interface LapMeta {
  id: string
  user_id: string
  track: string
  car: string
  created_at: string
  hash: string
}

function SteeringWheel({ angle = 0 }: { angle: number }) {
  return (
    <div className="w-[105px] h-[105px] relative">
      <div
        className="absolute w-full h-full transition-transform duration-100"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <Image
          src="/steering-wheel.png"
          alt="Steering Wheel"
          width={105}
          height={105}
        />
      </div>
    </div>
  )
}

function VerticalBar({ value, color }: { value: number, color: string }) {
  return (
    <div className="w-5.5 h-20 bg-gray-700 rounded relative overflow-hidden">
      <div
        className="absolute bottom-0 w-full rounded"
        style={{
          height: `${value}%`,
          backgroundColor: color,
          transition: 'height 0.2s ease',
        }}
      />
    </div>
  )
}

export default function UploadIdPage() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<ResultType | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [lapList, setLapList] = useState<LapMeta[]>([])
  const [selectedLapId, setSelectedLapId] = useState<string>('')
  const [xAxisKey, setXAxisKey] = useState<'time' | 'distance'>('time') // ✅ 토글 상태
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0)
  const [hoveredData, setHoveredData] = useState<Record<string, number> | null>(null)
  const [hoveredExitIndex, setHoveredExitIndex] = useState<number | null>(null)
  const [hoveredTrailIndex, setHoveredTrailIndex] = useState<number | null>(null)
  const [analysisMode, setAnalysisMode] = useState<'braking' | 'throttle'>('throttle')

  const toggleXAxis = () => {
    setXAxisKey(prev => (prev === 'time' ? 'distance' : 'time'))
  }

  const supabase = createPagesBrowserClient<Database>()

  useEffect(() => {
    const fetchUserAndLaps = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.id) {
        const uid = userData.user.id
        setUserId(uid)

        const { data: laps } = await supabase
          .from('lap_meta')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }) as PostgrestResponse<LapMeta>

        if (laps) setLapList(laps)
      }
    }

    fetchUserAndLaps()
  }, [])

  const getSummaryStats = (segment: Array<Record<string, number>>) => {
    if (!Array.isArray(segment) || segment.length === 0) return { duration: '0', maxSpeed: '-', minSpeed: '-' };

    const duration = (segment.at(-1)?.time ?? 0) - (segment[0]?.time ?? 0);
    const speeds = segment.map((d) => d.speed).filter((v) => v !== undefined && !isNaN(v));
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);

    return {
      duration: duration.toFixed(2),
      maxSpeed: maxSpeed.toFixed(1),
      minSpeed: minSpeed.toFixed(1),
    };
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // ✅ 로그인 안 된 경우 안내 후 업로드 차단
    if (!userId) {
      setMessage('❌ 로그인 후 이용해주세요');
      alert('로그인 후 이용해주세요 🔐'); // 또는 toast 사용 가능
      return;
    }

    if (!file) return;

    setMessage('업로드 중...')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    formData.append('save', 'true')
    formData.append('weather', 'sunny')
    formData.append('air_temp', '25')
    formData.append('track_temp', '32')

    try {
      const res = await fetch(`${API_URL}/api/analyze-motec-csv`, {
      // const res = await fetch(`http://localhost:8000/api/analyze-motec-csv`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data?.error?.includes("중복된 랩")) {
          setMessage('❌ 중복된 랩 데이터입니다.')
        } else {
          setMessage(`❌ 에러: ${data?.error || '알 수 없는 오류'}`)
        }
        return
      }

      setResult(data)
      setMessage('✅ 분석 완료')
    } catch (err) {
      console.error(err)
      setMessage('❌ 업로드 실패')
    }
  }

  const fetchLapDetail = async (lapId: string) => {
    setMessage('📦 저장된 랩 데이터 불러오는 중...')
    try {
      const res = await fetch(`${API_URL}/api/lap/${lapId}`)
      // const res = await fetch(`http://localhost:8000/api/lap/${lapId}`)
      const data = await res.json()

      if (!res.ok) {
        setMessage(`❌ 랩 데이터 불러오기 실패: ${data?.error || '서버 오류'}`)
        return
      }

      setResult(data)
      setMessage('✅ 데이터 불러오기 완료')
    } catch (err) {
      console.error(err)
      setMessage('❌ 네트워크 오류로 데이터 불러오기 실패')
    }
  }

  const splitByTimeGap = (data: Array<Record<string, number>>, threshold = 1.5) => {
    if (!data || data.length === 0) return []

    const result: Array<Array<Record<string, number>>> = []
    let currentGroup: Array<Record<string, number>> = [data[0]]

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1]
      const curr = data[i]
      const gap = curr.time - prev.time

      if (gap > threshold) {
        result.push(currentGroup)
        currentGroup = []
      }
      currentGroup.push(curr)
    }

    if (currentGroup.length) result.push(currentGroup)
    return result
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ACC 랩 분석 리포트</h2>
        <Link href="/">
          <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">홈으로</button>
        </Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* 📤 CSV 업로드 버튼 */}
        <div>
          <input id="csv-upload" type="file" accept=".csv" onChange={handleUpload} className="hidden" />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            📤 CSV 업로드
          </label>
        </div>

        {/* 📜 이전 랩 선택 드롭다운 */}
        {lapList.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="font-medium text-sm">📜 이전 랩 선택:</label>
            <select
              className="border rounded px-2 py-1 text-sm bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              value={selectedLapId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedLapId(id)
                if (id) fetchLapDetail(id)
              }}
            >
              <option value="">선택하세요</option>
              {lapList.map((lap) => (
                <option key={lap.id} value={lap.id}>
                  {lap.track} - {lap.car} ({new Date(lap.created_at).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>


      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📈 주행 시각화</h3>
        <button
          onClick={toggleXAxis}
          className="text-sm px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700 transition"
        >
          X축 전환: {xAxisKey === 'time' ? '⏱ 시간' : '📏 거리'}
        </button>
      </div>
      
      {result?.data && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-6">
          {/* 🧭 구간 선택 + 분석 모드 토글 (한 줄 정렬) */}
          <div className="flex justify-between items-center flex-wrap gap-2">
            {/* 🧭 구간 선택 */}
            <div className="flex items-center gap-2">
              <label className="font-medium text-sm">🧭 구간 선택:</label>
              <select
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedSegmentIndex}
                onChange={(e) => setSelectedSegmentIndex(Number(e.target.value))}
              >
                {splitByTimeGap(result.data).map((_, idx) => (
                  <option key={idx} value={idx}>
                    구간 {idx + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* 분석 모드 토글 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">분석 모드:</span>
              <button
                onClick={() => setAnalysisMode('braking')}
                className={`px-3 py-1 rounded text-sm ${analysisMode === 'braking' ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                브레이크
              </button>              
              <button
                onClick={() => setAnalysisMode('throttle')}
                className={`px-3 py-1 rounded text-sm ${analysisMode === 'throttle' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
              >
                스로틀
              </button>
            </div>
          </div>

          

          {(() => {
            const segments = splitByTimeGap(result.data)
            const segment = segments[selectedSegmentIndex]
            const stats = getSummaryStats(segment)

            // 🕒 현재 구간 시간 범위 계산
            const segmentStartTime = segment?.[0]?.time ?? 0
            const segmentEndTime = segment?.[segment.length - 1]?.time ?? 0

            // 💬 피드백 필터링: 시간 범위에 해당하는 corner exit 분석만 추출
            const feedbacksInThisSegment = result.corner_exit_analysis?.filter((c) => {
              const time = result.data?.[c.start_idx]?.time
              return time !== undefined && time >= segmentStartTime && time <= segmentEndTime
            }) ?? []

            return (
              <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                    📦 구간 {selectedSegmentIndex + 1}
                  </h4>
                </div>

                {/* 💬 자연어 피드백 */}
                {/* {feedbacksInThisSegment.length > 0 ? (
                  <div className="space-y-2">
                    {feedbacksInThisSegment.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-md bg-blue-50 dark:bg-blue-900 text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-600"
                      >
                        {f.feedback}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">해당 구간에 대한 피드백이 없습니다.</p>
                )} */}

                
                {/* 🚦 Throttle + Brake + 말풍선 통합 */}
                <div className="relative">
                  {/* 💬 Hover된 피드백 말풍선 */}
                  {analysisMode === 'throttle' && hoveredExitIndex !== null && feedbacksInThisSegment[hoveredExitIndex] && (
                    <div className="absolute -top-20 right-4 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-lg rounded p-3 z-50 max-w-[480px] text-sm text-gray-800 dark:text-gray-100">
                      {feedbacksInThisSegment[hoveredExitIndex]?.feedback}
                    </div>
                  )}

                  {analysisMode === 'braking' && hoveredTrailIndex !== null && result.corner_entry_analysis?.[hoveredTrailIndex] && (
                    <div className="absolute -top-20 right-4 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-lg rounded p-3 z-50 max-w-[480px] text-sm text-gray-800 dark:text-gray-100">
                      {result.corner_entry_analysis?.[hoveredTrailIndex]?.feedback}
                    </div>
                  )}

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={segment}
                      syncId="segment-sync"
                      onMouseMove={(state) => {
                        if (state?.activePayload && state.activePayload[0]?.payload) {
                          setHoveredData(state.activePayload[0].payload);
                        }
                      }}
                      onMouseLeave={() => {
                        setHoveredData(null);
                        setHoveredExitIndex(null);
                        setHoveredTrailIndex(null);
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={xAxisKey} tick={false} axisLine={false} />
                      <YAxis />
                      <Tooltip content={() => null} />

                      <Line type="monotone" dataKey="throttle" stroke="#82ca9d" dot={false} />
                      <Line type="monotone" dataKey="brake" stroke="#ff7300" dot={false} />
                      <Line type="monotone" dataKey="gear" stroke="transparent" dot={false} />

                      {/* ✅ 스로틀 모드 → 코너 탈출 강조 */}
                      {analysisMode === 'throttle' && feedbacksInThisSegment.map((f, idx) => {
                        const startTime = result.data?.[f.start_idx]?.time;
                        let endTime = result.data?.[f.end_idx]?.time;
                        if (endTime === undefined || endTime > segmentEndTime) {
                          endTime = segmentEndTime;
                        }
                        if (startTime === undefined || endTime === undefined) return null;

                        return (
                          <ReferenceArea
                            key={`exit-${idx}`}
                            x1={startTime}
                            x2={endTime}
                            strokeOpacity={0.1}
                            fill="#aaf"
                            fillOpacity={0.2}
                            onMouseEnter={() => setHoveredExitIndex(idx)}
                            onMouseLeave={() => setHoveredExitIndex(null)}
                          />
                        );
                      })
                      }

                      {/* ✅ 브레이킹 모드 → 트레일 브레이킹 강조 */}
                      {analysisMode === 'braking' && Array.isArray(result?.corner_entry_analysis) && 
                      result.corner_entry_analysis.map((zone, idx) => {
                        const startTime = result.data?.[zone.start_idx]?.time;
                        let endTime = result.data?.[zone.end_idx]?.time;

                        if (endTime === undefined || endTime > segmentEndTime) {
                          endTime = segmentEndTime;
                        }
                        if (startTime === undefined || endTime === undefined) return null;

                        return (
                          <ReferenceArea
                            key={`trail-${idx}`}
                            x1={startTime}
                            x2={endTime}
                            strokeOpacity={0.1}
                            fill="#ffa500"
                            fillOpacity={0.2}
                            onMouseEnter={() => setHoveredTrailIndex(idx)}
                            onMouseLeave={() => setHoveredTrailIndex(null)}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

         

              <div className="flex justify-between items-start text-sm mt-2">
                {/* 🏁 차량 및 트랙 정보 (왼쪽 정렬) */}
                <div className="flex gap-40 text-gray-700 dark:text-gray-300">
                  <p><strong>🏁 트랙:</strong> {result.track}</p>
                  <p><strong>🚗 차량:</strong> {result.car}</p>
                </div>

                {/* 📊 요약 정보 (오른쪽 정렬) */}
                <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                  <p><strong>⏱ 지속 시간:</strong> {stats.duration}초</p>
                  <p><strong>🚀 최고 속도:</strong> {stats.maxSpeed} kph</p>
                  <p><strong>🐢 최저 속도:</strong> {stats.minSpeed} kph</p>
                </div>
              </div>


              <div className="flex gap-4 mt-4 items-start">
                {/* 🚧 왼쪽 안내 박스 */}
                <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-400 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 p-4 min-h-[360px] max-w-[445px]">
                  <p className="text-gray-700 dark:text-gray-200 text-xl font-semibold text-center">
                    🛠 주행 라인 시각화 기능은 준비 중입니다.
                  </p>
                </div>   

                {/* 🏎 주행 정보 박스 */}
                <div className="relative rounded-xl shadow-md bg-white/80 dark:bg-gray-900/70 backdrop-blur-md border border-gray-300 dark:border-gray-700 p-6 pt-12 min-h-[160px] max-w-[480px]">
                  
                  {/* 🌀 RPM Shift Light - 항상 중앙 상단에 고정 */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    <RPMShiftLight rpm={hoveredData?.rpms ?? 0} />
                  </div>

                  {/* 내부 콘텐츠 틀 유지 */}
                  <div className="flex flex-wrap items-center justify-between gap-4 min-h-[100px]">
                    {/* 🕒 시간 or 거리 */}
                    <div className="text-center text-gray-800 dark:text-gray-100 text-2xl font-semibold min-w-[80px]">
                      {hoveredData ? <TimerDisplay value={hoveredData?.[xAxisKey] ?? 0} /> : '--:--'}
                    </div>

                    {/* ⚙️ 기어 + 속도 */}
                    <div className="min-w-[96px]">
                      <GearSpeedCircle gear={hoveredData?.gear ?? '-'} speed={hoveredData?.speed ?? 0} />
                    </div>

                    {/* 🧭 Steering */}
                    <div className="flex flex-col items-center min-w-[10px]">
                      <SteeringWheel angle={-(hoveredData?.steerangle ?? 0)} />
                    </div>

                    {/* 🦶 Throttle + Brake */}
                    <div className="flex flex-wrap items-center gap-1">
                      <div className="flex flex-col items-center min-w-[32px] text-sm">
                        <span className="mt-1 text-gray-700 dark:text-gray-200">
                          {hoveredData?.brake?.toFixed(0) ?? '-'}
                        </span>
                        <VerticalBar value={hoveredData?.brake ?? 0} color="#ff7300" />
                        <span className="mt-1 text-gray-700 dark:text-gray-200">BRK</span>
                      </div>
                      <div className="flex flex-col items-center min-w-[32px] text-sm">
                        <span className="mt-1 text-gray-700 dark:text-gray-200">
                          {hoveredData?.throttle?.toFixed(0) ?? '-'}
                        </span>
                        <VerticalBar value={hoveredData?.throttle ?? 0} color="#82ca9d" />
                        <span className="mt-1 text-gray-700 dark:text-gray-200">THR</span>
                      </div>                      
                    </div>
                  </div>

                  {/* 안내 문구 (hoveredData 없을 때만 표시) */}
                  {!hoveredData && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full max-w-[480px] min-h-[160px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-700 flex items-center justify-center">
                        <span className="text-gray-700 dark:text-gray-200 text-xl font-semibold text-center">
                          마우스를 그래프 위에 올려주세요 🖱️
                        </span>
                      </div>
                    </div>
                  )}

                {/* 📊 데이터 축적 문구 박스 */}
                <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-400 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 p-4 min-h-[160px] max-w-[445px]">
                  <p className="text-gray-700 dark:text-gray-200 text-xl font-semibold text-center">
                    🛠 비교 분석 기능은 준비 중입니다.
                  </p>
                </div>                  
                
                </div>
                
 
              </div>
                  
                {/* 📉 speed, steerangle */}
                {/* {["speed", "steerangle", "rpms"].map((key, i) => (
                  <ResponsiveContainer key={i} width="100%" height={200}>
                    <LineChart data={segment} syncId="segment-sync">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={xAxisKey} tick={false} axisLine={false} />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #4b5563',
                          color: '#f9fafb',
                        }}
                        labelStyle={{ color: '#d1d5db' }}
                        itemStyle={{ color: '#f9fafb' }}
                      />
                      <Line type="monotone" dataKey={key} stroke="#8884d8" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ))} */}
              </div>
            )
          })()}
        </div>
      )}


    </div>
  )
}
