/**
 * US 유저 cust_id 로드 및 수집 시작 (간단 버전)
 * 
 * 사용법:
 * 1. 제공받은 cust_id 텍스트를 전체 복사
 * 2. 아래 코드를 브라우저 콘솔에 붙여넣기
 * 3. custIdsText 변수에 텍스트 붙여넣기
 * 4. 실행
 */

// ============================================
// 1단계: 제공받은 cust_id 텍스트를 여기에 붙여넣기
// ============================================
const custIdsText = `여기에_전체_텍스트_붙여넣기`

// ============================================
// 2단계: 배열로 변환 (자동 실행)
// ============================================
const usCustIds = custIdsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && /^\d+$/.test(line))

console.log(`✅ 총 ${usCustIds.length}개 cust_id 로드됨`)
console.log(`첫 10개:`, usCustIds.slice(0, 10))
console.log(`마지막 10개:`, usCustIds.slice(-10))

// ============================================
// 3단계: collect-all-training-data.js 로드 후 실행
// ============================================
// collectAllTrainingData(usCustIds, 5, 50, false, 'us_collect_progress')


