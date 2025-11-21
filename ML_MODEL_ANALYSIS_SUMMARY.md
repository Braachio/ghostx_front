# iRacing 순위 예측 ML 모델 분석 요약

## 📊 현재 상태

### 데이터 현황
- **총 레코드 수**: 약 31,000개
- **유저 수**: 약 400명 (한국 유저 중심)
- **세션 수**: 수천 개 (중복 제거 후)

### 데이터 품질
- ✅ **높은 완성도**: `i_rating`, `safety_rating`, `best_lap_time` (99%+)
- ⚠️ **중간 완성도**: `average_lap_time` (38%)
- ❌ **낮은 완성도**: 최근 레이스 통계 필드들 (0% - API 제한)

## 🎯 핵심 개선 사항

### 1. 상대 전력 기반 예측 (핵심!)

**문제 인식:**
- 기존: 단순히 iRating 순서로 예측
- 문제: 같은 iRating이어도 상대 전력에 따라 성능이 다름
  - 예: iRating 2000이어도
    - 상대 평균 2200 → 실제 15등
    - 상대 평균 1800 → 실제 5등

**해결책:**
- 상대 전력 통계 필드 추가:
  - `avg_opponent_ir`: 상대들의 평균 iRating
  - `max_opponent_ir`: 상대들의 최고 iRating
  - `min_opponent_ir`: 상대들의 최저 iRating
  - `ir_diff_from_avg`: 내 iRating - 평균 상대 iRating

### 2. 유저별 상대 전력 구간별 성능 특성 (최신 개선!)

**인사이트:**
- 유저마다 상대 전력에 따른 성능 패턴이 다름
- 예:
  - 유저 A: 상대가 강할 때 집중력이 올라서 더 잘함 (집중력 유형)
  - 유저 B: 상대가 약할 때 압도적 실력으로 더 잘함 (압도적 실력 유형)

**구현:**
- 상대 전력 구간 정의:
  - `much_lower`: 내 iRating이 상대 평균보다 200+ 낮음 → **강한 상대**
  - `lower`: 내 iRating이 상대 평균보다 50-200 낮음 → **약간 강한 상대**
  - `similar`: 비슷함 (±50)
  - `higher`: 내 iRating이 상대 평균보다 50-200 높음 → **약간 약한 상대**
  - `much_higher`: 내 iRating이 상대 평균보다 200+ 높음 → **약한 상대**

- 유저별 특성 (7개):
  1. `user_avg_finish_pct_much_lower`: 강한 상대에서의 평균 완주율
  2. `user_avg_finish_pct_lower`: 약간 강한 상대에서의 평균 완주율
  3. `user_avg_finish_pct_similar`: 비슷한 상대에서의 평균 완주율
  4. `user_avg_finish_pct_higher`: 약간 약한 상대에서의 평균 완주율
  5. `user_avg_finish_pct_much_higher`: 약한 상대에서의 평균 완주율
  6. `user_ir_diff_performance_diff`: 강한 상대 성능 - 약한 상대 성능
     - 양수 = 강한 상대에서 더 잘함 (집중력 유형)
     - 음수 = 약한 상대에서 더 잘함 (압도적 실력 유형)
  7. `user_expected_finish_pct_by_ir_diff`: 현재 상대 전력 구간에서의 예상 성능

**데이터 누수 방지:**
- 각 레코드에 대해 **과거 데이터만** 사용하여 통계 계산
- 시간 순서대로 정렬 후, 현재 레코드 이전의 데이터만 사용

### 3. 특성 엔지니어링 개선

**파생 변수 추가:**
- `ir_advantage`: `ir_diff_from_avg / 100` (정규화)
- `ir_range`: `max_opponent_ir - min_opponent_ir` (상대 전력 분산)
- `ir_rank_pct`: `(i_rating - min_opponent_ir) / (max_opponent_ir - min_opponent_ir)` (상대 전력 내 위치)
- `ir_vs_max`: `i_rating - max_opponent_ir` (최고 상대와의 차이)
- `ir_vs_min`: `i_rating - min_opponent_ir` (최저 상대와의 차이)
- `ir_std_estimate`: `ir_range / 4` (표준편차 추정)
- `ir_relative_to_sof`: `(i_rating - sof) / sof` (SOF 대비 상대적 위치)
- `lap_time_diff`: `average_lap_time - best_lap_time` (랩타임 일관성)
- `lap_time_consistency`: `lap_time_diff / (best_lap_time + 1)` (일관성 지표)

### 4. 카테고리 변수 인코딩

**원-핫 인코딩 적용:**
- `series_id`: 시리즈별 특성 반영
- `track_id`: 트랙별 특성 반영
- `car_id`: 차량별 특성 반영

### 5. 고급 모델 도입

**모델 다양화:**
- RandomForest (기본)
- GradientBoosting (기본)
- XGBoost (선택적, 설치 시)
- LightGBM (선택적, 설치 시)
- Ensemble (R² 점수 기반 가중 평균)

**하이퍼파라미터 튜닝:**
- RandomizedSearchCV 사용
- 주요 파라미터: `n_estimators`, `max_depth`, `learning_rate` 등

### 6. 특화 모델

**유저별/트랙별/차량별 특화 모델:**
- 충분한 데이터가 있는 유저/트랙/차량에 대해 별도 모델 학습
- 더 정확한 예측 가능

### 7. NaN 처리 개선

**문제:**
- 유저별 상대 전력 특성들이 많은 NaN 포함 (과거 데이터 부족)

**해결책:**
- 유연한 계산 로직:
  1. 두 그룹 모두 있으면 직접 비교
  2. 한 그룹만 있으면 전체 평균과 비교
  3. `similar` 구간만 있어도 활용
  4. 과거 데이터가 없어도 기본값(0.0) 설정
- NaN 처리:
  - `user_ir_diff_performance_diff`: 0.0으로 대체 (성능 차이 없음)
  - 구간별 평균 완주율: 전체 평균 완주율로 대체
  - 예상 성능: 전체 평균 완주율로 대체

## 📈 모델 성능

### 현재 성능 (이전 측정)
- **R² Score**: 0.68 ~ 0.71
- **MAE**: 약 3-4등
- **RMSE**: 약 4-5등

### 개선 기대 효과

**유저별 상대 전력 특성 추가로 기대되는 개선:**
- 각 유저의 성능 패턴을 더 정확히 반영
- 상대 전력에 따른 성능 차이를 학습
- **예상 R² Score**: 0.75 ~ 0.80 (목표)

## 🔍 주요 인사이트

### 1. 상대 전력이 핵심
- 단순 iRating보다 **상대 전력 차이**가 더 중요
- 같은 iRating이어도 상대 전력에 따라 성능이 크게 다름

### 2. 유저별 성능 패턴
- 유저마다 상대 전력에 따른 성능 패턴이 다름
- 강한 상대에서 더 잘하는 유저 vs 약한 상대에서 더 잘하는 유저

### 3. 데이터 부족 문제
- 최근 레이스 통계 필드들이 대부분 0% (API 제한)
- 하지만 핵심 필드들(`i_rating`, `safety_rating`, 상대 전력 통계)은 충분히 수집됨

### 4. 레이스 시작 전 예측
- `starting_position`, `laps_complete` 등은 레이스 종료 후에만 알 수 있음
- 따라서 ML 모델 학습 시 제외해야 함

## 🚀 다음 단계

### 단기 (즉시 가능)
1. ✅ 유저별 상대 전력 특성 추가 완료
2. ✅ NaN 처리 개선 완료
3. ⏳ 모델 재학습 및 성능 평가
4. ⏳ 특성 중요도 분석

### 중기 (1-2주)
1. 더 많은 데이터 수집 (목표: 50,000+ 레코드)
2. 하이퍼파라미터 튜닝 최적화
3. 특화 모델 성능 평가
4. Ensemble 모델 최적화

### 장기 (1개월+)
1. 실시간 예측 API 통합
2. 프론트엔드에 예측 결과 표시
3. A/B 테스트 (규칙 기반 vs ML 모델)
4. 사용자 피드백 수집 및 모델 개선

## 📝 참고 문서

- `ML_MODEL_FEATURES_PRE_RACE.md`: 레이스 시작 전 특성 목록
- `DATA_CLEANUP_ANALYSIS.md`: 데이터 품질 분석
- `ML_MODEL_TRAINING_GUIDE.md`: 모델 학습 가이드
- `train_ml_model.py`: 모델 학습 스크립트

## 💡 핵심 교훈

1. **상대 전력이 절대 전력보다 중요**: 같은 iRating이어도 상대 전력에 따라 성능이 다름
2. **유저별 특성 고려**: 각 유저의 성능 패턴을 학습하는 것이 중요
3. **데이터 누수 방지**: 과거 데이터만 사용하여 통계 계산
4. **유연한 NaN 처리**: 데이터가 부족해도 기본값으로 대체하여 학습 가능


