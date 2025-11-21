# ML 학습 데이터 Feature 체크리스트

## ✅ 현재 수집 중인 모든 Feature

### 개인 특성
- ✅ iRating
- ✅ Safety Rating
- ✅ 평균 인시던트 (avg_incidents_per_race)
- ✅ DNF율 (dnf_rate)
- ✅ 평균 완주 순위 (avg_finish_position)
- ✅ 최근 평균 완주 순위 (recent_avg_finish_position)
- ✅ 우승률 (win_rate)
- ✅ Top5율 (top5_rate)
- ✅ Top10율 (top10_rate)
- ✅ IR 추세 (ir_trend)
- ✅ SR 추세 (sr_trend)

### 세션 결과 필드
- ✅ 베스트 랩타임 (best_lap_time)
- ✅ 선두 랩 수 (laps_led)
- ✅ 완주 랩 수 (laps_complete)
- ✅ 예선 시간 (qualifying_time)
- ✅ 포인트 (points)
- ✅ 차량 ID (car_id)
- ✅ 라이선스 레벨 (license_level)
- ✅ 시작 그리드 (starting_position)

### 추가 필드 (세션 전략 및 순위 예측에 활용) ⭐ NEW
- ✅ 클래스 내 순위 (finish_position_in_class)
- ✅ 앞 차와의 간격 (interval, interval_units)
- ✅ DNF 이유 (reason_out_id, reason_out_text)
- ✅ 평균 랩타임 (average_lap_time)
- ✅ 베스트 랩 번호 (best_lap_num)
- ✅ 무게 페널티 (weight_penalty_kg)
- ✅ iRating 변화량 (irating_change)
- ✅ Safety Rating 변화량 (safety_rating_change)
- ✅ 팀 정보 (team_id, team_name)
- ✅ 차량 클래스 (car_class_id, car_class_name)

### 세션 컨텍스트
- ✅ 시리즈 ID/이름 (series_id, series_name)
- ✅ 시즌 ID/이름 (season_id, season_name)
- ✅ 트랙 ID/이름 (track_id, track_name)
- ✅ 트랙 공유 ID (track_shared_id)
- ✅ 트랙 설정 (track_config)
- ✅ 세션 타입 (session_type)
- ✅ 실제 SOF (event_strength_of_field)
- ✅ 이벤트 평균 랩타임 (event_average_lap)
- ✅ 이벤트 평균 인시던트 (event_average_incidents)
- ✅ 총 참가자 수 (total_participants)
- ✅ 세션 시작 시간 (session_start_time)

### 상대 전력 통계
- ✅ 상대 평균 iRating (avg_opponent_ir)
- ✅ 상대 최고 iRating (max_opponent_ir)
- ✅ 상대 최저 iRating (min_opponent_ir)
- ✅ 평균 대비 iRating 차이 (ir_diff_from_avg)

### 실제 결과
- ✅ 실제 완주 순위 (actual_finish_position)
- ✅ 실제 인시던트 (actual_incidents)
- ✅ 실제 DNF 여부 (actual_dnf)

## Feature 활용 방안

### 세션 전략 제안에 활용
- **iRating vs SOF**: 공격/방어 전략 결정
- **최근 성적**: 페이스 유지 vs 공격적 추월
- **인시던트율**: 안전 운전 vs 공격적 운전
- **상대 전력**: 상대가 강하면 방어적, 약하면 공격적
- **트랙 설정**: 트랙별 특화 전략
- **차량 클래스**: 클래스별 경쟁 강도

### 순위 예측에 활용
- **iRating vs 상대**: 상대 전력 통계로 예측
- **최근 성적**: 최근 평균 순위로 예측
- **인시던트율**: 인시던트가 적을수록 높은 순위
- **DNF율**: DNF율이 낮을수록 높은 순위
- **IR 추세**: 상승 추세면 높은 순위 예측
- **시작 그리드**: 그리드가 앞이면 유리
- **평균 랩타임**: 페이스가 빠르면 높은 순위

## 데이터베이스 마이그레이션

새로운 필드를 추가하려면 다음 마이그레이션을 실행하세요:

```sql
-- DATABASE_MIGRATION_IRACING_ML_EXTENDED_FEATURES.sql 실행
```

## 다음 단계

1. ✅ 모든 필드 수집 로직 구현 완료
2. ⏳ 데이터베이스 마이그레이션 실행
3. ⏳ 대량 데이터 수집 시작
4. ⏳ ML 모델 학습 준비
