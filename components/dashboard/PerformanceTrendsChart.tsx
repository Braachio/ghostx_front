'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PerformanceTrendsChartProps {
  data: Array<{
    date: string
    lapTime: number
    track: string
    car: string
  }>
}

export default function PerformanceTrendsChart({ data }: PerformanceTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <i className="fas fa-chart-area text-4xl mb-4"></i>
          <p>트렌드 데이터가 없습니다.</p>
        </div>
      </div>
    )
  }

  // 날짜별로 데이터 포맷팅
  const chartData = data.map((item, index) => ({
    date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    lapTime: item.lapTime,
    track: item.track,
    car: item.car,
    index: index + 1
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => `${value.toFixed(1)}초`}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(3)}초`, '랩 타임']}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                const data = payload[0].payload
                return `${data.date} (${data.track})`
              }
              return label
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="lapTime" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
