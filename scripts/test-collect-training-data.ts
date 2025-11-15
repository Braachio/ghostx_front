/**
 * ML 학습 데이터 수집 테스트 스크립트
 * 
 * 사용법:
 * 1. 세션 ID 목록을 준비
 * 2. 이 스크립트를 실행하여 데이터 수집 테스트
 * 
 * 실행 방법:
 * - 브라우저 콘솔에서 실행
 * - 또는 별도 Node.js 스크립트로 실행
 */

async function collectTrainingData(sessionIds: number[]) {
  console.log(`[Test] Starting collection for ${sessionIds.length} sessions...`)
  
  try {
    const response = await fetch('/api/iracing/ml/collect-training-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subsessionIds: sessionIds
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log('[Test] Collection result:', result)
    
    return result
  } catch (error) {
    console.error('[Test] Collection failed:', error)
    throw error
  }
}

// 사용 예시
// 브라우저 콘솔에서 실행:
// collectTrainingData([71628994, 71693839, 71654541])

export { collectTrainingData }

