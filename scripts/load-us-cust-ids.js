/**
 * US 유저 cust_id 목록 로드 및 수집 시작
 * 브라우저 콘솔에서 실행
 */

// 1. 제공하신 cust_id 텍스트를 여기에 붙여넣기
const custIdsText = `513181
160282
410511
496280
...` // (전체 목록 붙여넣기)

// 2. 배열로 변환
const usCustIds = custIdsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && /^\d+$/.test(line))

console.log(`✅ 총 ${usCustIds.length}개 cust_id 로드됨`)

// 3. collect-all-training-data.js를 먼저 로드한 후 실행
// collectAllTrainingData(usCustIds, 5, 50, false, 'us_collect_progress')


