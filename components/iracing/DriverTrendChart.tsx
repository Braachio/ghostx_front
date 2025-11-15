'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import type { DriverTrendPoint } from '@/lib/iracingTypes'

interface DriverTrendChartProps {
  data: DriverTrendPoint[]
}

const formatDate = (input: string) => {
  try {
    const date = new Date(input)
    if (Number.isNaN(date.getTime())) return input
    return `${date.getMonth() + 1}/${date.getDate()}`
  } catch (e) {
    return input
  }
}

export default function DriverTrendChart({ data }: DriverTrendChartProps) {
  if (!data || data.length === 0) return null

  const sanitized = data
    .filter((point) => point.date)
    .map((point) => ({
      ...point,
      dateLabel: formatDate(point.date),
      // Safety Rating은 100배 값으로 저장되어 있으므로 100으로 나누어 표시
      safetyRating: point.safetyRating !== null && point.safetyRating !== undefined
        ? point.safetyRating > 10 ? point.safetyRating / 100 : point.safetyRating
        : null,
    }))

  if (!sanitized.length) return null

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">최근 기록 변화</h3>
        <span className="text-xs text-gray-500">iRating &amp; Safety Rating</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sanitized} margin={{ top: 10, left: 0, right: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="dateLabel" stroke="#6b7280" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="ir" stroke="#38bdf8" tick={{ fontSize: 12 }} domain={['auto', 'auto']} width={60} />
            <YAxis yAxisId="sr" orientation="right" stroke="#4ade80" tick={{ fontSize: 12 }} domain={[0, 5]} width={40} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', borderRadius: '0.75rem', border: '1px solid #1f2937' }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
            <Line
              yAxisId="ir"
              type="monotone"
              dataKey="irating"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
              name="iRating"
            />
            <Line
              yAxisId="sr"
              type="monotone"
              dataKey="safetyRating"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              name="Safety Rating"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
