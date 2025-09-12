'use client'

export default function VerticalBar({ value, color }: { value: number; color: string }) {
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
