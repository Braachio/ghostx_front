# 사고 시나리오 기반 예측 구현 완료

## 구현 완료 사항

### 1. 사고 영향도 특성 추가 ✅
**파일**: `ghostx_front/scripts/train_ml_model.py`

**추가된 특성:**
- `incident_impact_on_position`: 사고 발생 시 평균 순위 하락 (완주율 단위)
- `incident_impact_rank_drop`: 사고 발생 시 평균 순위 하락 (순위 단위)
- `high_incident_risk`: 사고 발생 확률이 높은지 여부 (0/1)

**계산 방법:**
- 각 드라이버의 과거 레이스에서 사고 발생 레이스와 사고 없는 레이스를 비교
- 평균 순위 차이를 계산하여 사고 영향도로 사용
- 사고 발생 확률이 50% 이상이면 `high_incident_risk = 1`

### 2. 시나리오 기반 예측 로직 ✅
**파일**: `ghostx_fastapi/services/ml_predictor.py`

**구현된 함수:**
- `estimate_incident_probability()`: 사고 확률 추정
- `predict_with_incident_scenarios()`: 시나리오 기반 예측

**시나리오:**
1. **사고 없음** (확률: 1 - incident_prob)
   - 예상 순위: 베이스 예측 그대로
2. **경미한 사고** (1-2회, 확률: incident_prob * 0.6)
   - 예상 순위: 베이스 + 2~3위 하락
3. **중간 사고** (3-5회, 확률: incident_prob * 0.3)
   - 예상 순위: 베이스 + 5~8위 하락
4. **심각한 사고** (6회 이상 또는 DNF, 확률: incident_prob * 0.1)
   - 예상 순위: 베이스 + 10위 이상 하락

**최종 예측:**
- 가중 평균으로 계산: `(베이스 * 확률_사고없음) + (베이스+2 * 확률_경미) + ...`

### 3. API 응답 확장 ✅
**파일**: `ghostx_fastapi/api/ml_predict.py`

**추가된 필드:**
- `incident_risk_level`: "low", "medium", "high"
- `incident_probability`: 0.0-1.0
- `predicted_rank_with_incidents`: 사고 고려한 예측 순위
- `min_rank`: 최선의 경우 (사고 없음)
- `max_rank`: 최악의 경우 (심각한 사고)

**신뢰도 조정:**
- 사고 확률이 높을수록 예측 신뢰도 감소
- `adjusted_confidence = base_confidence * (1 - incident_prob * 0.3)`

### 4. UI 표시 ✅
**파일**: `ghostx_front/app/iracing/page.tsx`

**표시 정보:**
- 사고 위험도: 낮음/보통/높음 (색상으로 구분)
- 사고 발생 확률: 백분율
- 예상 범위: 최선의 경우 ~ 최악의 경우
- 사고 고려 예측: 사고 발생 시나리오를 반영한 예측 순위

## 사용 방법

### 1. 모델 재학습
```bash
python ghostx_front/scripts/train_ml_model.py --mode pre
python ghostx_front/scripts/train_ml_model.py --mode post
```

### 2. 앙상블 설정 생성
```bash
python ghostx_front/scripts/generate_ensemble_config.py --mode pre
python ghostx_front/scripts/generate_ensemble_config.py --mode post
```

### 3. FastAPI 서버 재시작
환경 변수 설정 후 서버 재시작:
```bash
IRACING_ENSEMBLE_CONFIG_PRE=path/to/pre/ensemble_config.json
IRACING_ENSEMBLE_CONFIG_POST=path/to/post/ensemble_config.json
```

## 작동 원리

1. **베이스 예측**: ML 모델이 사고 없이 완주할 경우의 예상 순위를 예측
2. **사고 확률 추정**: 드라이버의 과거 사고율, DNF율, 위험도 플래그를 기반으로 사고 발생 확률 계산
3. **시나리오 생성**: 사고 없음/경미/중간/심각 4가지 시나리오 생성
4. **가중 평균**: 각 시나리오의 확률과 예상 순위를 가중 평균하여 최종 예측
5. **신뢰도 조정**: 사고 위험도가 높을수록 예측 신뢰도 감소

## 예시

**드라이버 A (사고 위험 낮음):**
- 베이스 예측: 5등
- 사고 확률: 20%
- 예상 범위: 4~7등
- 최종 예측: 5.2등

**드라이버 B (사고 위험 높음):**
- 베이스 예측: 5등
- 사고 확률: 70%
- 예상 범위: 3~12등
- 최종 예측: 7.5등

## 향후 개선 사항

1. **사고 확률 예측 모델**: 별도의 ML 모델로 사고 확률을 더 정확하게 예측
2. **트랙/조건별 사고 패턴**: 특정 트랙이나 날씨 조건에서의 사고 패턴 분석
3. **실시간 업데이트**: 레이스 진행 중 사고 발생 시 예측 업데이트
4. **몬테카를로 시뮬레이션**: 1000회 시뮬레이션으로 더 정확한 예측 범위 계산

