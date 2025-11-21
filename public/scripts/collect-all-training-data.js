/**
 * 여러 cust_id의 모든 학습 데이터 수집 스크립트
 * 브라우저 콘솔에서 실행
 * 
 * 대량 cust_id 처리 지원:
 * - 파일에서 cust_id 목록 로드 가능
 * - 진행 상황 저장 및 재개 가능
 * - 에러 처리 강화
 */

// 한국 유저 cust_id 목록 (기본값)
const KOREAN_USER_IDS = [
  '309265', '262743', '581167', '285643', '260023', '549448', '884271', '883055', '650982', '107331',
  '336097', '471469', '107816', '903646', '814119', '590617', '224144', '417925', '947752', '600760',
  '425681', '964014', '632153', '702516', '638599', '533283', '414449', '577311', '817684', '355110',
  '844744', '930741', '812314', '316344', '430658', '936122', '716643', '102744', '148593', '535865',
  '1025245', '846096', '663317', '1036658', '1028659', '811279', '110930', '819718', '417749', '906414',
  '841121', '282201', '614365', '648753', '859853', '1054479', '1064680', '871692', '733369', '365321',
  '440330', '431811', '705999', '353365', '969036', '717534', '848332', '949948', '1066763', '438592',
  '541844', '800460', '1048606', '679752', '995822', '552900', '898019', '954473', '106690', '228705',
  '724754', '966322', '829867', '961585', '979786', '1066336', '984656', '637677', '839986', '768983',
  '873713', '963377', '710671', '1046008', '1029692', '955141', '805383', '594593', '941440', '855788',
  '671236', '659869', '1038205', '909017', '990852', '974872', '1053384', '971967', '228473', '757861',
  '771436', '1063069', '978308', '902598', '1042604', '586983', '1046812', '1018543', '817891', '971352',
  '840488', '964045', '627117', '809928', '100162', '1003499', '1052310', '899425', '816813', '964788',
  '837855', '211239', '937099', '849120', '633475', '600294', '782112', '1043091', '979493', '558603',
  '968014', '831485', '835940', '658416', '912255', '897258', '1051956', '768612', '174654', '815933',
  '1060971', '588562', '605055', '648627', '901186', '738115', '784562', '969110', '855658', '825315',
  '1006852', '185584', '129537', '965781', '959623', '973569', '984790', '141034', '974867', '413967',
  '775945', '819288', '138870', '695170', '936457', '1008408', '938054', '999987', '1055250', '897720',
  '776907', '898566', '767189', '1027926', '779083', '1011765', '1059270', '1064270', '868660', '139323',
  '972508', '230686', '171687', '420569', '593896', '968354', '998897', '1015019', '726262', '869863',
  '1043106', '838741', '1048357', '1040317', '1045153', '813220', '650385', '1046359', '1066920', '1050695',
  '881100', '1059671', '969000', '1038236', '991419', '1059504', '823136', '1062432', '1023959', '723090',
  '996361', '1012824', '491771', '760674', '661315', '995826', '975604', '1039218', '1051090', '984680',
  '642682', '627063', '656225', '867250', '1059542', '937912', '1048833', '998059', '1008386', '784959',
  '916988', '552658', '877703', '772662', '962389', '778809', '277376', '927579', '945515', '115370',
  '1023942', '748458', '772118', '890412', '603545', '858313', '971090', '627164', '1019474', '1031411',
  '1017715', '626610', '821248', '1064283', '715161', '957204', '1053071', '1055537', '445685', '1043460',
  '1009829', '937918', '973522', '1046503', '1044001', '842715', '785788', '815353', '954325', '1057896',
  '730249', '1026518', '1054954', '748932', '983159', '1067343', '949295', '947879', '608141', '544144',
  '673579', '732513', '1052264', '974953', '866245', '974842', '1018150', '1059626', '906630', '962460',
  '758781', '978787', '964806', '963982', '934801', '1007457', '321235', '867003', '138275', '691858',
  '841993', '425321', '935349', '390448', '1047624', '735960', '1027260', '769051', '649891', '1051112',
  '564581', '943318', '1019012', '870278', '995206', '629930', '1020731', '957791', '1006368', '1067427',
  '805399', '1067317', '1066888', '1001837', '1067251', '1067384', '1068574', '1068360', '1064245', '1059115',
  '504143', '927058', '1065965', '1065443', '1059524', '1063606', '1065433', '684958', '1065469', '816904',
  '1063183', '1062735', '924304', '1061975', '1057884', '1058814', '650958', '1000038', '1059580', '1059849',
  '1058377', '1060072', '1057768', '1055528', '1049590', '676708', '892571', '993840', '1029829', '1054937',
  '1049478', '1054943', '1054488', '939128', '969249', '1046204', '1050661', '1048883', '1048286', '1045045',
  '726418', '1048336', '1041182', '1048650', '1042535', '211376', '1013888', '1045901', '1044714', '1039730',
  '803337', '1041765', '1042144', '1037766', '984660', '1038220', '980442', '101110', '1037295', '1036706',
  '1036667', '1036084', '1036761', '1029745', '1002919', '1030689', '1032851', '1028539', '1009172', '1006437',
  '1025426', '658769', '994470', '1022739', '1027910', '971593', '1018153', '924624', '634079', '1016154',
  '1014017', '719993', '1018565'
]

/**
 * 단일 cust_id의 세션 ID 수집 (재시도 로직 포함)
 */
async function getSessionIdsForCustId(custId, limit = 50, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`/api/iracing/ml/get-recent-session-ids?cust_id=${custId}&limit=${limit}`)
      
      // 429 에러 처리
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After')
        // 429 에러는 더 길게 대기: 10초, 20초, 30초, 40초, 50초
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 10000
        console.warn(`  ⚠️  Rate limit (429) - ${waitTime/1000}초 대기 후 재시도... (시도 ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      const data = await res.json()
      return data.sessionIds || []
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`  ❌ cust_id ${custId} 세션 ID 가져오기 실패 (최대 재시도 초과):`, error)
        return []
      }
      // 재시도 전 대기 (더 길게)
      const waitTime = (attempt + 1) * 5000 // 5초, 10초, 15초, 20초
      console.warn(`  ⚠️  에러 발생, ${waitTime/1000}초 후 재시도... (시도 ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  return []
}

/**
 * 파일에서 cust_id 목록 로드 (선택적)
 * 파일 형식: 한 줄에 하나씩 cust_id
 */
function loadCustIdsFromText(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // 빈 줄과 주석 제거
    .filter(line => /^\d+$/.test(line)) // 숫자만 허용
}

/**
 * 진행 상황 저장 (localStorage 사용)
 */
function saveProgress(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString()
    }))
  } catch (e) {
    console.warn('진행 상황 저장 실패:', e)
  }
}

/**
 * 진행 상황 로드
 */
function loadProgress(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.warn('진행 상황 로드 실패:', e)
    return null
  }
}

/**
 * 여러 cust_id의 모든 학습 데이터 수집
 * 
 * @param {string[]} custIds - cust_id 목록
 * @param {number} batchSize - 배치 크기 (기본값: 2, 대량 데이터 수집 시 1 권장)
 * @param {number} sessionLimitPerUser - 유저당 세션 제한 (기본값: 50)
 * @param {boolean} resume - 이전 진행 상황 재개 (기본값: false)
 * @param {string} progressKey - 진행 상황 저장 키 (기본값: 'collect_progress')
 * @param {number} requestDelay - 요청 간 딜레이(ms) (기본값: 1000, 서버 rate limit 완화됨)
 */
async function collectAllTrainingData(
  custIds = KOREAN_USER_IDS, 
  batchSize = 2, 
  sessionLimitPerUser = 50,
  resume = false,
  progressKey = 'collect_progress',
  requestDelay = 1000
) {
  console.log(`🚀 [전체 수집 시작]`)
  console.log(`   총 cust_id: ${custIds.length}개`)
  console.log(`   배치 크기: ${batchSize}개`)
  console.log(`   유저당 세션 제한: ${sessionLimitPerUser}개`)
  console.log(`   요청 간 딜레이: ${requestDelay}ms`)
  console.log(`   재개 모드: ${resume ? 'ON' : 'OFF'}`)
  
  const allSessionIds = new Set() // 중복 제거를 위해 Set 사용
  const custIdStats = {}
  let startIndex = 0
  
  // 진행 상황 로드
  if (resume) {
    const progress = loadProgress(progressKey)
    if (progress) {
      console.log(`\n📂 [진행 상황 복원]`)
      console.log(`   저장 시점: ${progress.savedAt}`)
      console.log(`   처리된 cust_id: ${progress.processedCustIds || 0}개`)
      console.log(`   수집된 세션: ${progress.collectedSessions || 0}개`)
      
      if (progress.processedCustIds) {
        startIndex = progress.processedCustIds
        console.log(`   ${startIndex}번째 cust_id부터 재개합니다.`)
      }
      
      // 이전에 수집한 세션 ID 복원
      if (progress.sessionIds && Array.isArray(progress.sessionIds)) {
        progress.sessionIds.forEach(id => allSessionIds.add(id))
        console.log(`   ${allSessionIds.size}개 세션 ID 복원됨`)
      }
    }
  }
  
  // 1. 모든 cust_id의 세션 ID 수집
  console.log(`\n📥 [1단계] 모든 cust_id의 세션 ID 수집 중...`)
  const progressSaveInterval = 5 // 5명마다 진행 상황 저장 (더 자주 저장)
  
  for (let i = startIndex; i < custIds.length; i++) {
    const custId = String(custIds[i]).trim()
    const progress = `[${i + 1}/${custIds.length}]`
    
    // 진행 상황 표시 (50명마다 상세 로그, 처음 10명은 항상 표시)
    if (i % 50 === 0 || i < startIndex + 10 || i === startIndex) {
      console.log(`${progress} cust_id ${custId} 처리 중...`)
    }
    
    try {
      const sessionIds = await getSessionIdsForCustId(custId, sessionLimitPerUser)
      
      if (sessionIds.length > 0) {
        sessionIds.forEach(id => allSessionIds.add(id))
        custIdStats[custId] = sessionIds.length
        if (i % 50 === 0 || i < startIndex + 10 || i === startIndex) {
          console.log(`  ✅ ${sessionIds.length}개 세션 ID 발견 (누적: ${allSessionIds.size}개)`)
        }
      } else {
        custIdStats[custId] = 0
        if (i % 50 === 0 || i < startIndex + 10 || i === startIndex) {
          console.log(`  ⚠️  세션 ID 없음`)
        }
      }
    } catch (error) {
      console.error(`  ❌ cust_id ${custId} 처리 실패:`, error)
      custIdStats[custId] = -1 // 에러 표시
    }
    
    // 진행 상황 저장 (주기적으로)
    if ((i + 1) % progressSaveInterval === 0) {
      saveProgress(progressKey, {
        processedCustIds: i + 1,
        collectedSessions: allSessionIds.size,
        sessionIds: Array.from(allSessionIds)
      })
      if (i % 50 === 0) {
        console.log(`  💾 진행 상황 저장됨 (${i + 1}/${custIds.length})`)
      }
    }
    
    // Rate limit 방지 (유저 간 딜레이)
    // 연속 429 에러가 많으면 딜레이를 점진적으로 증가
    if (i < custIds.length - 1) {
      const currentDelay = requestDelay
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }
  
  // 최종 진행 상황 저장
  saveProgress(progressKey, {
    processedCustIds: custIds.length,
    collectedSessions: allSessionIds.size,
    sessionIds: Array.from(allSessionIds),
    completed: true
  })
  
  const uniqueSessionIds = Array.from(allSessionIds)
  console.log(`\n✅ [1단계 완료] 총 ${uniqueSessionIds.length}개의 고유 세션 ID 수집`)
  
  // 2. 모든 세션 ID를 배치로 나눠서 수집
  console.log(`\n📦 [2단계] 모든 세션 데이터 수집 중...`)
  let totalCollected = 0
  let totalFailed = 0
  const errors = []
  
  for (let i = 0; i < uniqueSessionIds.length; i += batchSize) {
    const batch = uniqueSessionIds.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(uniqueSessionIds.length / batchSize)
    
    console.log(`\n📦 [배치 ${batchNum}/${totalBatches}] ${batch.length}개 세션 수집 중...`)
    
    let retryCount = 0
    const maxRetries = 3
    let success = false
    
    while (retryCount < maxRetries && !success) {
      try {
        const collectRes = await fetch('/api/iracing/ml/collect-training-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subsessionIds: batch })
        })
        
        // 429 에러 처리
        if (collectRes.status === 429) {
          const retryAfter = collectRes.headers.get('Retry-After')
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (retryCount + 1) * 10000 // 기본 10초, 20초, 30초
          console.warn(`   ⚠️  Rate limit (429) - ${waitTime/1000}초 대기 후 재시도... (시도 ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retryCount++
          continue
        }
        
        if (!collectRes.ok) {
          throw new Error(`HTTP ${collectRes.status}: ${collectRes.statusText}`)
        }
        
        const result = await collectRes.json()
        
        if (result.success) {
          totalCollected += result.totalCollected || 0
          totalFailed += result.totalFailed || 0
          
          if (result.errors && result.errors.length > 0) {
            errors.push(...result.errors)
          }
          
          console.log(`   ✅ 수집 완료: ${result.totalCollected}개 레코드 (실패: ${result.totalFailed})`)
          success = true
        } else {
          console.error(`   ❌ 수집 실패:`, result)
          totalFailed += batch.length
          success = true // 실패했지만 재시도하지 않음
        }
      } catch (error) {
        if (retryCount === maxRetries - 1) {
          console.error(`   ❌ 배치 ${batchNum} 에러 (최대 재시도 초과):`, error)
          totalFailed += batch.length
          errors.push(`배치 ${batchNum}: ${error.message}`)
          success = true // 재시도 포기
        } else {
          const waitTime = (retryCount + 1) * 5000 // 5초, 10초, 15초
          console.warn(`   ⚠️  에러 발생, ${waitTime/1000}초 후 재시도... (시도 ${retryCount + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          retryCount++
        }
      }
    }
    
    // Rate limit 방지 (배치 간 딜레이)
    if (i + batchSize < uniqueSessionIds.length) {
      // 서버 rate limit이 완화되었으므로 딜레이 감소
      const delayTime = Math.max(1000, requestDelay) // 최소 1초, 또는 requestDelay와 동일
      console.log(`   ⏳ ${delayTime/1000}초 대기 중...`)
      await new Promise(resolve => setTimeout(resolve, delayTime))
    }
  }
  
  // 3. 최종 결과
  console.log(`\n🎉 [수집 완료]`)
  console.log(`   총 cust_id: ${custIds.length}개`)
  console.log(`   총 고유 세션: ${uniqueSessionIds.length}개`)
  console.log(`   수집된 레코드: ${totalCollected}개`)
  console.log(`   실패한 세션: ${totalFailed}개`)
  
  const usersWithSessions = Object.values(custIdStats).filter(count => count > 0).length
  console.log(`   세션이 있는 유저: ${usersWithSessions}/${custIds.length}명`)
  
  if (errors.length > 0) {
    console.log(`   에러 목록 (최대 10개):`, errors.slice(0, 10))
  }
  
  return {
    totalCustIds: custIds.length,
    totalSessions: uniqueSessionIds.length,
    totalCollected,
    totalFailed,
    usersWithSessions,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * cust_id 텍스트를 배열로 변환하고 데이터 수집 시작
 * 
 * @param {string} custIdsText - cust_id 텍스트 (한 줄에 하나씩)
 * @param {number} batchSize - 한 번에 처리할 cust_id 개수 (기본값: 100)
 * @param {number} delay - 요청 간 딜레이(ms) (기본값: 1000)
 * @param {string} progressKey - 진행 상황 저장 키 (기본값: 'collect_progress')
 */
function quickCollect(custIdsText, batchSize = 100, delay = 1000, progressKey = 'collect_progress') {
  // 텍스트를 배열로 변환
  const custIds = custIdsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+$/.test(line))
  
  console.log(`✅ ${custIds.length}개 cust_id 로드됨`)
  console.log(`📦 ${batchSize}개씩 처리, 딜레이: ${delay}ms`)
  
  // 첫 번째 배치 시작
  const batch = custIds.slice(0, batchSize)
  console.log(`🚀 배치 1 시작 (${batch.length}개)`)
  
  return collectAllTrainingData(
    batch,
    1,                      // 세션 배치 크기: 1
    50,                     // 유저당 세션 제한
    false,                  // 처음 시작
    progressKey,
    delay
  )
}

/**
 * 다음 배치 수집 (이전 배치 완료 후 사용)
 * 
 * @param {string} custIdsText - 전체 cust_id 텍스트
 * @param {number} batchNumber - 배치 번호 (1부터 시작)
 * @param {number} batchSize - 한 번에 처리할 cust_id 개수 (기본값: 100)
 * @param {number} delay - 요청 간 딜레이(ms) (기본값: 1000)
 * @param {string} progressKey - 진행 상황 저장 키 (기본값: 'collect_progress')
 */
function nextBatch(custIdsText, batchNumber, batchSize = 100, delay = 1000, progressKey = 'collect_progress') {
  const custIds = custIdsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+$/.test(line))
  
  const startIndex = (batchNumber - 1) * batchSize
  const endIndex = startIndex + batchSize
  const batch = custIds.slice(startIndex, endIndex)
  
  if (batch.length === 0) {
    console.log('✅ 모든 배치 완료!')
    return
  }
  
  console.log(`🚀 배치 ${batchNumber} 시작 (${batch.length}개, ${startIndex + 1}~${Math.min(endIndex, custIds.length)}번째)`)
  
  return collectAllTrainingData(
    batch,
    1,
    50,
    false,
    `${progressKey}_batch${batchNumber}`,
    delay
  )
}

