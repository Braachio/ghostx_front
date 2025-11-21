/**
 * cust_id 텍스트를 JavaScript 배열로 변환
 * 브라우저 콘솔에서 실행
 * 
 * 사용법:
 * 1. 제공받은 cust_id 텍스트를 복사
 * 2. 아래 코드를 콘솔에 붙여넣기
 * 3. custIdsText 변수에 텍스트 붙여넣기
 * 4. 실행하면 usCustIds 배열이 생성됨
 */

// 1. 제공받은 cust_id 텍스트를 여기에 붙여넣기 (전체 복사)
const custIdsText = `여기에_전체_텍스트_붙여넣기`

// 2. 배열로 변환
const usCustIds = custIdsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && /^\d+$/.test(line))

console.log(`✅ 총 ${usCustIds.length}개 cust_id 로드됨`)
console.log(`첫 10개:`, usCustIds.slice(0, 10))
console.log(`마지막 10개:`, usCustIds.slice(-10))

// 3. 배열 확인 후 수집 시작
// collectAllTrainingData(usCustIds, 5, 50, false, 'us_collect_progress')


