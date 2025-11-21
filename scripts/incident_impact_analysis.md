# 사고(Incidents) 영향도 분석 및 예측 개선 방안

## 현재 상태
- `avg_incidents_per_race`: 평균 사고율 (특성으로 포함됨)
- `dnf_rate`: DNF율 (특성으로 포함됨)
- 하지만 사고 발생 시나리오나 사고로 인한 순위 변동은 직접 모델링되지 않음

## 제안 방안

### 1. 사고 확률 예측 모델 (Incident Probability Model)
각 드라이버의 사고 발생 확률을 예측하는 별도 모델 학습

**특성:**
- 과거 사고율 (`avg_incidents_per_race`)
- 최근 사고 추세 (최근 3경기 평균)
- 트랙별 사고율 (특정 트랙에서의 사고 패턴)
- SOF별 사고율 (강한 상대 vs 약한 상대)
- 시간대별 사고율 (새벽/저녁 등)
- 차량별 사고율 (특정 차량에서의 사고 패턴)

**출력:**
- 사고 발생 확률 (0.0 ~ 1.0)
- 예상 사고 횟수 (연속 변수)

### 2. 사고 영향도 특성 추가
과거 데이터에서 사고 발생 시 평균 순위 하락 계산

**새로운 특성:**
- `incident_impact_on_position`: 사고 발생 시 평균 순위 하락
- `high_incident_risk`: 사고 발생 확률이 높은지 여부 (0/1)
- `incident_volatility`: 사고 발생의 변동성 (표준편차)

**계산 방법:**
```python
# 과거 레이스에서 사고 발생 시 순위 하락 분석
for driver in drivers:
    races_with_incidents = driver.races[driver.races.incidents > 0]
    races_without_incidents = driver.races[driver.races.incidents == 0]
    
    avg_position_with_incidents = races_with_incidents.finish_position.mean()
    avg_position_without_incidents = races_without_incidents.finish_position.mean()
    
    incident_impact = avg_position_with_incidents - avg_position_without_incidents
```

### 3. 시나리오 기반 예측 (Scenario-Based Prediction)
베이스 예측 + 사고 발생 시나리오를 결합

**구현:**
1. 베이스 예측: 사고 없이 완주할 경우의 예상 순위
2. 사고 시나리오: 사고 발생 확률 기반으로 여러 시나리오 생성
   - 시나리오 1: 사고 없음 (확률: 1 - incident_prob)
   - 시나리오 2: 경미한 사고 (1-2회, 확률: incident_prob * 0.6)
   - 시나리오 3: 중간 사고 (3-5회, 확률: incident_prob * 0.3)
   - 시나리오 4: 심각한 사고 (6회 이상 또는 DNF, 확률: incident_prob * 0.1)

3. 각 시나리오별 예상 순위 계산:
   - 경미한 사고: 베이스 순위 + 2~3위 하락
   - 중간 사고: 베이스 순위 + 5~8위 하락
   - 심각한 사고: 베이스 순위 + 10위 이상 하락 또는 DNF

4. 최종 예측: 가중 평균
   ```
   predicted_rank = (베이스 * 확률_사고없음) + 
                     (베이스+2 * 확률_경미) + 
                     (베이스+6 * 확률_중간) + 
                     (베이스+15 * 확률_심각)
   ```

### 4. 불확실성/신뢰도 조정
사고 가능성이 높은 드라이버의 예측 신뢰도 낮추기

**신뢰도 계산:**
```python
base_confidence = model_r2_score  # 기본 신뢰도 (예: 0.78)

# 사고 위험도에 따른 신뢰도 조정
incident_risk_factor = incident_probability * 0.3  # 사고 확률이 높을수록 신뢰도 감소
adjusted_confidence = base_confidence * (1 - incident_risk_factor)

# 예측 범위 확대
prediction_range = base_range * (1 + incident_risk_factor)
```

### 5. UI 개선
사용자에게 사고 위험도와 예측 범위 표시

**표시 정보:**
- 베이스 예측 순위: "예상 순위: 5등"
- 사고 위험도: "사고 위험: 낮음/보통/높음"
- 예측 범위: "예상 범위: 3~8등" (사고 발생 가능성 고려)
- 시나리오별 확률: "사고 없음: 70%, 경미한 사고: 20%, 중간 사고: 8%, 심각한 사고: 2%"

## 구현 우선순위

### Phase 1: 기본 사고 영향도 특성 추가 (즉시 구현 가능)
1. `incident_impact_on_position` 특성 계산 및 추가
2. `high_incident_risk` 플래그 추가
3. 모델 재학습

### Phase 2: 사고 확률 예측 모델 (1-2주)
1. 사고 확률 예측 모델 학습
2. 시나리오 기반 예측 로직 구현
3. UI에 사고 위험도 표시

### Phase 3: 고급 시나리오 분석 (선택사항)
1. 몬테카를로 시뮬레이션 (1000회 시뮬레이션)
2. 트랙/조건별 사고 패턴 분석
3. 실시간 사고 위험도 업데이트

## 데이터 요구사항
현재 수집 중인 데이터:
- ✅ `incidents`: 레이스당 사고 횟수
- ✅ `dnf`: DNF 여부
- ✅ `avg_incidents_per_race`: 평균 사고율

추가로 필요한 데이터 (이미 수집 가능):
- 트랙별 사고율 (track_id + incidents)
- 시간대별 사고율 (hour_of_day + incidents)
- SOF별 사고율 (sof + incidents)

