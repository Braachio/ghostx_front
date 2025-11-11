import type { CSSProperties } from 'react'

export interface BrandMarkProps {
  size?: number
  className?: string
  textClassName?: string
}

export default function BrandMark({ size = 32, className = '', textClassName = '' }: BrandMarkProps) {
  const style: CSSProperties = { width: size, height: size }
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-black font-black tracking-wide uppercase ${className}`}
      style={style}
    >
      <span className={`leading-none ${textClassName}`} style={{ fontSize: size * 0.35 }}>
        GPX
      </span>
    </div>
  )
}
