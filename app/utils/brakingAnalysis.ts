// utils/brakingAnalysis.ts
export function analyzeBrakingPointAndSlope(
  data: Array<Record<string, number>>,
  segmentStart: number,
  segmentEnd: number
) {
  const segmentData = data.filter(
    (row) => row.distance >= segmentStart && row.distance <= segmentEnd
  )

  const threshold = 0.05  // 브레이크를 밟기 시작했다고 판단할 최소값

  let brakeStartIndex = -1
  for (let i = 0; i < segmentData.length; i++) {
    if (segmentData[i].brake >= threshold) {
      brakeStartIndex = i
      break
    }
  }

  if (brakeStartIndex === -1) {
    return {
      brakeStartDistance: null,
      brakeSlope: null,
    }
  }

  // 일정 구간동안의 평균 기울기 (brake 증가량 / 시간)
  const slopeWindow = 10
  const startPoint = segmentData[brakeStartIndex]
  const endPoint = segmentData[brakeStartIndex + slopeWindow] || segmentData.at(-1)

  const brakeSlope =
    (endPoint.brake - startPoint.brake) / (endPoint.time - startPoint.time || 1)

  return {
    brakeStartDistance: startPoint.distance,
    brakeSlope: brakeSlope,
  }
}
