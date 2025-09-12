'use client'
import Image from 'next/image'

export default function SteeringWheel({ angle = 0 }: { angle: number }) {
  return (
    <div className="w-[105px] h-[105px] relative">
      <div
        className="absolute w-full h-full transition-transform duration-100"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        <Image src="/steering-wheel.png" alt="Steering Wheel" width={105} height={105} />
      </div>
    </div>
  )
}
