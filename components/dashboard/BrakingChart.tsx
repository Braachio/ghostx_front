'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface BrakingChartProps {
  data: Array<{
    id: string
    corner_index: number
    segment_name: string
    brake_peak: number
    decel_avg: number
    trail_braking_ratio: number
    abs_on_ratio: number
  }>
}

export default function BrakingChart({ data }: BrakingChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <i className="fas fa-chart-line text-4xl mb-4"></i>
          <p>브레이킹 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  // 바 차트용 데이터
  const barData = data.map(zone => ({
    name: zone.segment_name || `코너 ${zone.corner_index + 1}`,
    brakePeak: zone.brake_peak,
    deceleration: zone.decel_avg
  }))

  // 레이더 차트용 데이터 (첫 번째 존만)
  const radarData = data.length > 0 ? [
    {
      subject: '브레이킹 강도',
      A: data[0].brake_peak,
      fullMark: 100
    },
    {
      subject: '감속률',
      A: Math.min(data[0].decel_avg * 5, 100), // 스케일 조정
      fullMark: 100
    },
    {
      subject: '트레일 브레이킹',
      A: data[0].trail_braking_ratio * 100,
      fullMark: 100
    },
    {
      subject: 'ABS 사용률',
      A: (1 - data[0].abs_on_ratio) * 100, // 낮을수록 좋음
      fullMark: 100
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* 브레이킹 강도 및 감속률 바 차트 */}
      <div className="h-64 w-full">
        <h4 className="text-sm font-medium text-gray-700 mb-2">브레이킹 강도 & 감속률</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              stroke="#666"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'brakePeak' ? `${value.toFixed(1)}%` : `${value.toFixed(1)} m/s²`,
                name === 'brakePeak' ? '브레이킹 강도' : '감속률'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="brakePeak" 
              fill="#ef4444" 
              name="brakePeak"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="deceleration" 
              fill="#3b82f6" 
              name="deceleration"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 레이더 차트 (첫 번째 존) */}
      {radarData.length > 0 && (
        <div className="h-64 w-full">
          <h4 className="text-sm font-medium text-gray-700 mb-2">성능 분석 (첫 번째 코너)</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#666" fontSize={12} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                stroke="#666" 
                fontSize={10}
                tickFormatter={(value) => `${value}%`}
              />
              <Radar 
                name="성능" 
                dataKey="A" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
