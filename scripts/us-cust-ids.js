/**
 * US 유저 cust_id 목록
 * 총 약 40,000개 이상
 */

const US_CUST_IDS = [
  '513181', '160282', '410511', '496280', '61454', '138679', '220097', '539778', '292374', '444482',
  '82554', '509410', '23801', '529939', '121085', '155121', '343397', '125400', '814387', '202872',
  // ... (전체 목록은 너무 길어서 일부만 표시)
  // 실제 사용 시에는 사용자가 제공한 전체 목록을 여기에 포함
]

// 전체 목록을 배열로 변환하는 헬퍼 함수
function parseCustIdsFromText(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+$/.test(line))
}

// 사용자가 제공한 텍스트를 배열로 변환
// 브라우저 콘솔에서 실행:
// const custIdsText = `...` // 사용자가 제공한 텍스트
// const usCustIds = parseCustIdsFromText(custIdsText)
// console.log(`총 ${usCustIds.length}개 cust_id 로드됨`)


