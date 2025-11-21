"""
iRacing 순위 예측 ML 모델 학습 스크립트

사용법:
    python scripts/train_ml_model.py

환경 설정:
    pip install pandas scikit-learn numpy matplotlib supabase
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV, RandomizedSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import warnings
warnings.filterwarnings('ignore')

# 고급 모델 시도 (설치되어 있으면)
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("ℹ️  XGBoost가 설치되지 않았습니다. 설치하면 성능이 향상될 수 있습니다: pip install xgboost")

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("ℹ️  LightGBM이 설치되지 않았습니다. 설치하면 성능이 향상될 수 있습니다: pip install lightgbm")
import matplotlib.pyplot as plt
import joblib
import json
from datetime import datetime
from pathlib import Path

# .env 파일 지원
try:
    from dotenv import load_dotenv
    # 프로젝트 루트에서 .env 파일 찾기
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ .env 파일 로드: {env_path}")
    else:
        # 현재 디렉토리에서도 시도
        load_dotenv()
except ImportError:
    print("ℹ️  python-dotenv가 설치되지 않았습니다. .env 파일을 사용하려면: pip install python-dotenv")
    pass

# Supabase 연결 (환경 변수에서 가져오기)
try:
    from supabase import create_client
    
    # 환경 변수 읽기 (여러 이름 시도)
    SUPABASE_URL = (
        os.getenv('NEXT_PUBLIC_SUPABASE_URL') or 
        os.getenv('SUPABASE_URL') or
        os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    )
    SUPABASE_KEY = (
        os.getenv('SUPABASE_SERVICE_ROLE_KEY') or 
        os.getenv('SUPABASE_KEY') or
        os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    )
    
    # 디버깅: 환경 변수 확인
    print("\n🔍 환경 변수 확인:")
    print(f"   NEXT_PUBLIC_SUPABASE_URL: {'설정됨' if SUPABASE_URL else '❌ 없음'}")
    print(f"   SUPABASE_SERVICE_ROLE_KEY: {'설정됨' if SUPABASE_KEY else '❌ 없음'}")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("\n⚠️  Supabase 환경 변수가 설정되지 않았습니다.")
        print("\n해결 방법:")
        print("1. PowerShell에서 환경 변수 설정:")
        print("   $env:NEXT_PUBLIC_SUPABASE_URL='your-url'")
        print("   $env:SUPABASE_SERVICE_ROLE_KEY='your-key'")
        print("\n2. 또는 .env 파일 생성 (프로젝트 루트에):")
        print("   NEXT_PUBLIC_SUPABASE_URL=your-url")
        print("   SUPABASE_SERVICE_ROLE_KEY=your-key")
        print("\n3. 또는 스크립트 내에서 직접 설정 (보안 주의)")
        sys.exit(1)
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 연결 성공\n")
except ImportError:
    print("⚠️  supabase 패키지가 설치되지 않았습니다.")
    print("   pip install supabase 실행하세요.")
    sys.exit(1)
except Exception as e:
    print(f"⚠️  Supabase 연결 실패: {e}")
    sys.exit(1)

# Post-grid 모드에서만 사용되는 특성들
POST_ONLY_FEATURES = [
    'starting_position',
    'starting_rank_pct',
    'qualifying_position',
    'qualifying_best_lap_time',
    'practice_best_lap_time',
    'fastest_qualifying_lap_time',
    # ⚠️ fastest_race_lap_time 제거: 레이스 중에 발생하는 정보이므로 데이터 누수
    # 'fastest_race_lap_time',  # 레이스 시작 전에는 알 수 없음!
]


def load_data():
    """Supabase에서 학습 데이터 로드"""
    print("📥 데이터 로드 중...")
    
    # 전체 데이터 로드 (페이지네이션)
    all_data = []
    page_size = 1000
    offset = 0
    
    while True:
        response = supabase.table('iracing_ml_training_data')\
            .select('*')\
            .range(offset, offset + page_size - 1)\
            .execute()
        
        if not response.data or len(response.data) == 0:
            break
        
        all_data.extend(response.data)
        offset += page_size
        
        if len(response.data) < page_size:
            break
        
        print(f"   {len(all_data)}개 레코드 로드됨...")
    
    df = pd.DataFrame(all_data)
    print(f"✅ 총 {len(df)}개 레코드 로드 완료")
    return df


def preprocess_data(df):
    """데이터 전처리"""
    print("\n🔧 데이터 전처리 중...")
    
    # 필수 필드 확인 (레이스 시작 전에 알 수 있는 필드만)
    required_fields = [
        'i_rating', 'safety_rating',
        'avg_opponent_ir', 'max_opponent_ir', 'min_opponent_ir',
        'ir_diff_from_avg', 'sof', 'total_participants',
        'best_lap_time',
        'actual_finish_position'  # 타겟 변수
    ]
    # 제외: starting_position, laps_complete (레이스 시작 전에 알 수 없음)
    
    # 필수 필드가 모두 있는 레코드만 선택
    initial_count = len(df)
    df_clean = df.dropna(subset=required_fields)
    print(f"   필수 필드 확인: {initial_count}개 → {len(df_clean)}개")
    
    # average_lap_time null 처리 (best_lap_time으로 대체)
    if 'average_lap_time' in df_clean.columns:
        null_count = df_clean['average_lap_time'].isna().sum()
        df_clean['average_lap_time'] = df_clean['average_lap_time'].fillna(df_clean['best_lap_time'])
        print(f"   average_lap_time null 처리: {null_count}개 레코드 (best_lap_time으로 대체)")
    
    # 특성 엔지니어링 (개선)
    print("   파생 변수 생성 중...")
    
    # 상대 전력 관련 파생 변수
    df_clean['ir_advantage'] = df_clean['ir_diff_from_avg'] / 100
    df_clean['ir_range'] = df_clean['max_opponent_ir'] - df_clean['min_opponent_ir']
    df_clean['ir_rank_pct'] = (
        (df_clean['i_rating'] - df_clean['min_opponent_ir']) / 
        (df_clean['max_opponent_ir'] - df_clean['min_opponent_ir'] + 1)
    )
    
    # 추가 상대 전력 파생 변수
    df_clean['ir_vs_max'] = df_clean['i_rating'] - df_clean['max_opponent_ir']  # 최고 상대와의 차이
    df_clean['ir_vs_min'] = df_clean['i_rating'] - df_clean['min_opponent_ir']  # 최저 상대와의 차이
    df_clean['ir_std_estimate'] = df_clean['ir_range'] / 4  # 대략적인 표준편차 추정
    df_clean['ir_relative_to_sof'] = (df_clean['i_rating'] - df_clean['sof']) / df_clean['sof']  # SOF 대비 상대적 위치
    
    # 주행 특성 파생 변수
    df_clean['lap_time_diff'] = df_clean['average_lap_time'] - df_clean['best_lap_time']
    df_clean['lap_time_consistency'] = df_clean['lap_time_diff'] / (df_clean['best_lap_time'] + 1)  # 일관성 (낮을수록 좋음)
    
    if 'starting_position' in df_clean.columns:
        df_clean['starting_rank_pct'] = df_clean['starting_position'] / df_clean['total_participants']
    
    # 세션 컨텍스트 파생 변수
    df_clean['participant_density'] = df_clean['total_participants']  # 참가자 밀도 (추가 특성 엔지니어링 가능)
    
    # ⚠️ starting_rank_pct는 제외 (레이스 시작 전에 알 수 없음)
    # df_clean['starting_rank_pct'] = df_clean['starting_position'] / df_clean['total_participants']
    
    # 유저별 SOF 구간별 성능 특성 추가 (핵심!)
    print("   유저별 상대 전력 구간별 성능 특성 계산 중...")
    df_clean = add_user_sof_performance_features(df_clean)
    
    # 사고 영향도 특성 추가
    print("   사고 영향도 특성 계산 중...")
    df_clean = add_incident_impact_features(df_clean)
    
    # 유저별 상대 전력 특성들의 NaN 처리
    user_ir_diff_features = [
        'user_avg_finish_pct_much_lower',
        'user_avg_finish_pct_lower',
        'user_avg_finish_pct_similar',
        'user_avg_finish_pct_higher',
        'user_avg_finish_pct_much_higher',
        'user_ir_diff_performance_diff',
        'user_expected_finish_pct_by_ir_diff'
    ]
    
    print("   유저별 상대 전력 특성 NaN 처리 중...")
    for feature in user_ir_diff_features:
        if feature in df_clean.columns:
            null_count = df_clean[feature].isna().sum()
            if null_count > 0:
                # NaN을 중앙값으로 대체 (해당 유저의 전체 평균 성능이 없으면 0.5 사용)
                if feature == 'user_ir_diff_performance_diff':
                    # 성능 차이는 0으로 대체 (차이가 없다는 의미)
                    df_clean[feature] = df_clean[feature].fillna(0.0)
                elif feature == 'user_expected_finish_pct_by_ir_diff':
                    # 예상 성능은 전체 평균 완주율로 대체
                    if 'actual_finish_position' in df_clean.columns and 'total_participants' in df_clean.columns:
                        avg_finish_pct = (df_clean['actual_finish_position'] / df_clean['total_participants']).median()
                        df_clean[feature] = df_clean[feature].fillna(avg_finish_pct)
                    else:
                        df_clean[feature] = df_clean[feature].fillna(0.5)
                else:
                    # 각 구간별 평균 완주율은 전체 평균 완주율로 대체
                    if 'actual_finish_position' in df_clean.columns and 'total_participants' in df_clean.columns:
                        avg_finish_pct = (df_clean['actual_finish_position'] / df_clean['total_participants']).median()
                        df_clean[feature] = df_clean[feature].fillna(avg_finish_pct)
                    else:
                        df_clean[feature] = df_clean[feature].fillna(0.5)
                print(f"      {feature}: {null_count}개 NaN 처리 완료")
    
    # 최종 NaN 확인 및 처리 (나머지 특성들)
    print("   최종 NaN 확인 중...")
    nan_counts = df_clean.isna().sum()
    features_with_nan = nan_counts[nan_counts > 0]
    if len(features_with_nan) > 0:
        print(f"   ⚠️  NaN이 있는 특성: {len(features_with_nan)}개")
        for feature, count in features_with_nan.items():
            if feature not in user_ir_diff_features and feature != 'actual_finish_position':
                # 숫자형 특성은 중앙값으로, 그 외는 0으로 대체
                if df_clean[feature].dtype in ['float64', 'int64']:
                    median_val = df_clean[feature].median()
                    if pd.isna(median_val):
                        df_clean[feature] = df_clean[feature].fillna(0)
                    else:
                        df_clean[feature] = df_clean[feature].fillna(median_val)
                else:
                    df_clean[feature] = df_clean[feature].fillna(0)
                print(f"      {feature}: {count}개 NaN 처리 완료")
    
    # 최종 확인: 학습에 사용할 특성들에 NaN이 없는지 확인
    print("   학습 특성 NaN 최종 확인...")
    final_nan_check = df_clean.isna().sum().sum()
    if final_nan_check > 0:
        print(f"   ⚠️  경고: 여전히 {final_nan_check}개 NaN이 남아있습니다.")
        # NaN이 있는 행 제거 (최후의 수단)
        initial_len = len(df_clean)
        df_clean = df_clean.dropna()
        removed = initial_len - len(df_clean)
        if removed > 0:
            print(f"   {removed}개 레코드 제거됨 (NaN 포함)")
    else:
        print("   ✅ 모든 특성에 NaN 없음")
    
    print(f"✅ 전처리 완료: {len(df_clean)}개 레코드")
    return df_clean


def add_incident_impact_features(df):
    """사고 영향도 특성 추가: 사고 발생 시 평균 순위 하락 계산"""
    print("   사고 영향도 특성 계산 중...")
    
    # 필요한 컬럼 확인
    required_cols = ['cust_id', 'actual_finish_position', 'total_participants']
    if not all(col in df.columns for col in required_cols):
        print("   ⚠️  사고 영향도 계산에 필요한 컬럼이 없어 건너뜁니다.")
        return df
    
    # incidents 컬럼 확인 (actual_incidents도 확인)
    if 'incidents' not in df.columns:
        if 'actual_incidents' in df.columns:
            # actual_incidents를 incidents로 매핑
            df['incidents'] = df['actual_incidents'].fillna(0)
            print("   ✅ actual_incidents를 incidents로 매핑했습니다.")
        else:
            # incidents가 없으면 0으로 설정 (사고 데이터 없음)
            df['incidents'] = 0
            print("   ⚠️  incidents 컬럼이 없어 0으로 설정했습니다.")
    
    # 시간 순서대로 정렬 (과거 데이터만 사용하기 위해)
    if 'session_start_time' in df.columns:
        df = df.sort_values(['cust_id', 'session_start_time']).reset_index(drop=True)
    else:
        df = df.sort_values('cust_id').reset_index(drop=True)
    
    # 각 유저별로 사고 영향도 계산
    incident_impact_stats = {}
    high_incident_risk_flags = {}
    
    unique_users = df['cust_id'].unique()
    print(f"   {len(unique_users)}명의 유저에 대해 사고 영향도 계산 중...")
    
    # 디버깅: 레이스 수 분포 확인
    user_race_counts = df.groupby('cust_id').size()
    print(f"   📊 레이스 수 분포:")
    print(f"      - 0개: {sum(user_race_counts == 0)}명")
    print(f"      - 1개: {sum(user_race_counts == 1)}명")
    print(f"      - 2개: {sum(user_race_counts == 2)}명")
    print(f"      - 3개 이상: {sum(user_race_counts >= 3)}명")
    print(f"      - 평균 레이스 수: {user_race_counts.mean():.1f}개")
    print(f"      - 중앙값 레이스 수: {user_race_counts.median():.1f}개")
    
    for user_id in unique_users:
        user_data = df[df['cust_id'] == user_id].copy()
        
        if len(user_data) < 3:  # 최소 3개 레이스로 완화 (5 -> 3)
            continue
        
        # 사고 발생 레이스와 사고 없는 레이스 분리
        races_with_incidents = user_data[user_data['incidents'] > 0]
        races_without_incidents = user_data[user_data['incidents'] == 0]
        
        # 사고 발생 확률 계산
        incident_rate = len(races_with_incidents) / len(user_data) if len(user_data) > 0 else 0.0
        
        # 사고 영향도 계산
        if len(races_with_incidents) > 0 and len(races_without_incidents) > 0:
            # 양쪽 데이터가 모두 있으면 직접 계산
            avg_finish_pct_with_incidents = (races_with_incidents['actual_finish_position'] / 
                                             races_with_incidents['total_participants']).mean()
            avg_finish_pct_without_incidents = (races_without_incidents['actual_finish_position'] / 
                                                races_without_incidents['total_participants']).mean()
            incident_impact = avg_finish_pct_with_incidents - avg_finish_pct_without_incidents
        elif len(races_with_incidents) > 0:
            # 사고 발생 레이스만 있는 경우: 전체 평균과 비교
            avg_finish_pct_with_incidents = (races_with_incidents['actual_finish_position'] / 
                                             races_with_incidents['total_participants']).mean()
            overall_avg = (user_data['actual_finish_position'] / user_data['total_participants']).mean()
            incident_impact = avg_finish_pct_with_incidents - overall_avg
        elif len(races_without_incidents) > 0:
            # 사고 없는 레이스만 있는 경우: 0으로 설정 (사고 영향 없음)
            incident_impact = 0.0
        else:
            # 데이터가 없는 경우
            incident_impact = 0.0
        
        incident_impact_stats[user_id] = float(incident_impact)
        
        # 사고 발생 확률이 0.5 이상이면 높은 위험으로 간주
        high_incident_risk_flags[user_id] = 1 if incident_rate >= 0.5 else 0
        
        # 평균 순위 계산 (완주율로 정규화)
        avg_finish_pct_with_incidents = (races_with_incidents['actual_finish_position'] / 
                                         races_with_incidents['total_participants']).mean()
        avg_finish_pct_without_incidents = (races_without_incidents['actual_finish_position'] / 
                                            races_without_incidents['total_participants']).mean()
        
        # 사고 발생 시 평균 순위 하락 (완주율 차이)
        incident_impact = avg_finish_pct_with_incidents - avg_finish_pct_without_incidents
        incident_impact_stats[user_id] = float(incident_impact)
        
        # 사고 발생 확률 계산
        incident_rate = len(races_with_incidents) / len(user_data)
        # 사고 발생 확률이 0.5 이상이면 높은 위험으로 간주
        high_incident_risk_flags[user_id] = 1 if incident_rate >= 0.5 else 0
    
    # 통계를 데이터프레임에 추가
    df['incident_impact_on_position'] = df['cust_id'].map(incident_impact_stats).fillna(0.0)
    df['high_incident_risk'] = df['cust_id'].map(high_incident_risk_flags).fillna(0)
    
    # 사고 발생 시 평균 순위 하락 (위치 단위로 변환)
    # 완주율 차이를 평균 참가자 수로 곱하여 실제 순위 하락으로 변환
    avg_participants = df['total_participants'].mean() if 'total_participants' in df.columns else 20
    df['incident_impact_rank_drop'] = df['incident_impact_on_position'] * avg_participants
    
    # 통계 출력
    total_users = len(unique_users)
    calculated_users = len(incident_impact_stats)
    users_with_impact = sum(1 for v in incident_impact_stats.values() if abs(v) > 0.01)  # 0.01 이상 차이가 있는 경우
    high_risk_users = sum(1 for v in high_incident_risk_flags.values() if v == 1)
    
    print(f"   ✅ {calculated_users}명의 유저에 대해 사고 영향도 계산 완료")
    print(f"      - 사고 영향도가 있는 유저: {users_with_impact}명 ({users_with_impact/calculated_users*100:.1f}%)")
    print(f"      - 높은 사고 위험 유저: {high_risk_users}명 ({high_risk_users/calculated_users*100:.1f}%)")
    if calculated_users < total_users:
        skipped = total_users - calculated_users
        print(f"      - 계산 생략된 유저: {skipped}명 (최소 3개 레이스 필요)")
    
    return df


def add_user_sof_performance_features(df):
    """유저별 상대 전력(ir_diff_from_avg) 구간별 성능 특성 추가 (핵심!)"""
    # ir_diff_from_avg 구간 정의 (상대 전력 대비 내 위치)
    def get_ir_diff_range(ir_diff):
        if pd.isna(ir_diff):
            return None
        if ir_diff < -200:
            return 'much_lower'  # 내가 상대 평균보다 200 이상 낮음 → 강한 상대
        elif ir_diff < -50:
            return 'lower'  # 내가 상대 평균보다 50-200 낮음 → 약간 강한 상대
        elif ir_diff < 50:
            return 'similar'  # 비슷함
        elif ir_diff < 200:
            return 'higher'  # 내가 상대 평균보다 50-200 높음 → 약간 약한 상대
        else:
            return 'much_higher'  # 내가 상대 평균보다 200 이상 높음 → 약한 상대
    
    # ir_diff_from_avg 구간 추가
    df['ir_diff_range'] = df['ir_diff_from_avg'].apply(get_ir_diff_range)
    
    # 시간 순서대로 정렬 (과거 데이터만 사용하기 위해)
    if 'session_start_time' in df.columns:
        df = df.sort_values(['cust_id', 'session_start_time']).reset_index(drop=True)
    else:
        df = df.sort_values('cust_id').reset_index(drop=True)
    
    print("   유저별 상대 전력 구간별 성능 특성 계산 중...")
    print("   (내 iRating vs 상대 평균 iRating 차이에 따른 성능 패턴)")
    
    # 유저별로 그룹화하여 효율적으로 계산
    new_features = []
    
    # 각 상대 전력 구간별 특성 컬럼 초기화
    for ir_diff_range in ['much_lower', 'lower', 'similar', 'higher', 'much_higher']:
        col_name = f'user_avg_finish_pct_{ir_diff_range}'
        df[col_name] = None
        new_features.append(col_name)
    
    # 상대 전력 성능 차이 (약한 상대에서의 성능 - 강한 상대에서의 성능)
    df['user_ir_diff_performance_diff'] = None
    new_features.append('user_ir_diff_performance_diff')
    
    # 현재 상대 전력 구간에 대한 유저의 예상 성능
    df['user_expected_finish_pct_by_ir_diff'] = None
    new_features.append('user_expected_finish_pct_by_ir_diff')
    
    # 유저별로 처리
    user_groups = df.groupby('cust_id')
    total_users = len(user_groups)
    processed = 0
    
    for cust_id, user_data in user_groups:
        processed += 1
        if processed % 100 == 0:
            print(f"   진행: {processed}/{total_users}명 유저 처리됨")
        
        # 시간 순서대로 정렬
        if 'session_start_time' in user_data.columns:
            user_data = user_data.sort_values('session_start_time')
        
        user_indices = user_data.index.values
        
        # 각 레코드에 대해 과거 데이터만 사용하여 통계 계산
        for i, idx in enumerate(user_indices):
            # 현재 레코드 이전의 데이터만 선택
            past_data = user_data.iloc[:i]
            
            # 유저의 전체 평균 완주율 계산 (기준점)
            if len(past_data) > 0:
                all_finish_pcts = past_data['actual_finish_position'] / past_data['total_participants']
                overall_avg_finish_pct = all_finish_pcts.mean()
            else:
                # 과거 데이터가 없으면 기본값 사용 (나중에 NaN 처리)
                overall_avg_finish_pct = None
            
            # 상대 전력 구간별 통계 계산 (최소 레코드 수를 1개로 낮춤)
            stats = {}
            for ir_diff_range in ['much_lower', 'lower', 'similar', 'higher', 'much_higher']:
                if len(past_data) > 0:
                    range_data = past_data[past_data['ir_diff_range'] == ir_diff_range]
                    if len(range_data) >= 1:  # 최소 1개 레이스만 있어도 계산
                        # 실제 완주 순위의 백분율 (낮을수록 좋음)
                        finish_pcts = range_data['actual_finish_position'] / range_data['total_participants']
                        stats[f'avg_finish_pct_{ir_diff_range}'] = finish_pcts.mean()
                    else:
                        stats[f'avg_finish_pct_{ir_diff_range}'] = None
                else:
                    stats[f'avg_finish_pct_{ir_diff_range}'] = None
            
            # 상대 전력 성능 차이 (강한 상대에서의 성능 - 약한 상대에서의 성능)
            # 양수 = 강한 상대에서 더 잘함 (집중력 유형), 음수 = 약한 상대에서 더 잘함 (압도적 실력 유형)
            # 더 유연한 계산: 강한 상대 그룹과 약한 상대 그룹의 평균을 비교
            
            # 강한 상대 그룹 (much_lower, lower)
            strong_opponent_pcts = []
            if stats.get('avg_finish_pct_much_lower') is not None:
                strong_opponent_pcts.append(stats['avg_finish_pct_much_lower'])
            if stats.get('avg_finish_pct_lower') is not None:
                strong_opponent_pcts.append(stats['avg_finish_pct_lower'])
            strong_avg = np.mean(strong_opponent_pcts) if len(strong_opponent_pcts) > 0 else None
            
            # 약한 상대 그룹 (much_higher, higher)
            weak_opponent_pcts = []
            if stats.get('avg_finish_pct_much_higher') is not None:
                weak_opponent_pcts.append(stats['avg_finish_pct_much_higher'])
            if stats.get('avg_finish_pct_higher') is not None:
                weak_opponent_pcts.append(stats['avg_finish_pct_higher'])
            weak_avg = np.mean(weak_opponent_pcts) if len(weak_opponent_pcts) > 0 else None
            
            # 성능 차이 계산 (더 유연하게)
            ir_diff_performance_diff = None
            if strong_avg is not None and weak_avg is not None:
                # 두 그룹 모두 있으면 직접 비교
                ir_diff_performance_diff = strong_avg - weak_avg
            elif strong_avg is not None and overall_avg_finish_pct is not None:
                # 강한 상대 그룹만 있으면 전체 평균과 비교
                ir_diff_performance_diff = strong_avg - overall_avg_finish_pct
            elif weak_avg is not None and overall_avg_finish_pct is not None:
                # 약한 상대 그룹만 있으면 전체 평균과 비교 (부호 반전)
                ir_diff_performance_diff = overall_avg_finish_pct - weak_avg
            elif stats.get('avg_finish_pct_similar') is not None and overall_avg_finish_pct is not None:
                # similar 구간과 전체 평균 비교 (최소한의 정보라도 활용)
                ir_diff_performance_diff = stats['avg_finish_pct_similar'] - overall_avg_finish_pct
            elif overall_avg_finish_pct is not None:
                # 과거 데이터는 있지만 특정 구간 데이터가 없으면, 전체 평균을 기준으로 추정
                # 현재 레이스의 ir_diff_from_avg를 기반으로 추정
                current_ir_diff = user_data.loc[idx, 'ir_diff_from_avg']
                if pd.notna(current_ir_diff):
                    # ir_diff가 음수면 (내가 약함) 강한 상대에서 더 잘할 가능성, 양수면 (내가 강함) 약한 상대에서 더 잘할 가능성
                    # 하지만 이건 추측이므로 보수적으로 0에 가까운 값 사용
                    ir_diff_performance_diff = 0.0  # 성능 차이 없음으로 가정
                else:
                    ir_diff_performance_diff = 0.0
            else:
                # 과거 데이터가 전혀 없으면 0으로 설정 (성능 차이 없음)
                ir_diff_performance_diff = 0.0
            
            stats['ir_diff_performance_diff'] = ir_diff_performance_diff
            
            # 각 상대 전력 구간별 특성 추가
            for ir_diff_range in ['much_lower', 'lower', 'similar', 'higher', 'much_higher']:
                col_name = f'user_avg_finish_pct_{ir_diff_range}'
                df.at[idx, col_name] = stats.get(f'avg_finish_pct_{ir_diff_range}', None)
            
            # 상대 전력 성능 차이 특성
            df.at[idx, 'user_ir_diff_performance_diff'] = stats.get('ir_diff_performance_diff', None)
            
            # 현재 상대 전력 구간에 대한 유저의 예상 성능
            current_ir_diff_range = user_data.loc[idx, 'ir_diff_range']
            if current_ir_diff_range:
                df.at[idx, 'user_expected_finish_pct_by_ir_diff'] = stats.get(
                    f'avg_finish_pct_{current_ir_diff_range}', None
                )
    
    print(f"   ✅ {len(new_features)}개 유저 상대 전력 특성 추가")
    
    return df


def encode_categorical_features(df, categorical_cols=['series_id', 'track_id', 'car_id'], use_onehot=True):
    """카테고리 변수 인코딩"""
    if not use_onehot or not categorical_cols:
        return df, None, []
    
    print(f"\n🔤 카테고리 변수 인코딩 중: {categorical_cols}")
    
    # 존재하는 카테고리 컬럼만 선택
    available_cols = [col for col in categorical_cols if col in df.columns]
    if not available_cols:
        print("   ⚠️  인코딩할 카테고리 변수가 없습니다.")
        return df, None, []
    
    # 원-핫 인코딩
    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore', drop='first')
    encoded_features = encoder.fit_transform(df[available_cols])
    
    # 인코딩된 컬럼 이름 생성
    feature_names = []
    for i, col in enumerate(available_cols):
        categories = encoder.categories_[i]
        for cat in categories[1:]:  # drop='first'이므로 첫 번째 카테고리 제외
            feature_names.append(f"{col}_{int(cat)}")
    
    # 인코딩된 데이터프레임 생성
    encoded_df = pd.DataFrame(encoded_features, columns=feature_names, index=df.index)
    
    # 원본 데이터프레임과 결합
    df_encoded = pd.concat([df.drop(columns=available_cols), encoded_df], axis=1)
    
    print(f"   ✅ {len(available_cols)}개 변수 → {len(feature_names)}개 특성으로 인코딩")
    
    return df_encoded, encoder, feature_names


def train_model(X_train, y_train, X_test, y_test, model_type='random_forest', tune_hyperparams=False):
    """ML 모델 학습 (하이퍼파라미터 튜닝 옵션 포함)"""
    print(f"\n🤖 {model_type} 모델 학습 중...")
    
    if model_type == 'random_forest':
        if tune_hyperparams:
            print("   하이퍼파라미터 튜닝 중...")
            param_grid = {
                'n_estimators': [100, 200, 300],
                'max_depth': [15, 20, 25, None],
                'min_samples_split': [5, 10, 15],
                'min_samples_leaf': [2, 5, 10]
            }
            base_model = RandomForestRegressor(random_state=42, n_jobs=-1)
            search = RandomizedSearchCV(
                base_model, param_grid, n_iter=20, cv=3, 
                scoring='r2', n_jobs=-1, random_state=42, verbose=1
            )
            search.fit(X_train, y_train)
            model = search.best_estimator_
            print(f"   최적 파라미터: {search.best_params_}")
        else:
            model = RandomForestRegressor(
                n_estimators=200,
                max_depth=25,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
    elif model_type == 'gradient_boosting':
        if tune_hyperparams:
            print("   하이퍼파라미터 튜닝 중...")
            param_grid = {
                'n_estimators': [200, 300, 400],
                'learning_rate': [0.05, 0.1, 0.15],
                'max_depth': [8, 10, 12],
                'min_samples_split': [5, 10, 15],
                'min_samples_leaf': [2, 5]
            }
            base_model = GradientBoostingRegressor(random_state=42)
            search = RandomizedSearchCV(
                base_model, param_grid, n_iter=20, cv=3,
                scoring='r2', n_jobs=-1, random_state=42, verbose=1
            )
            search.fit(X_train, y_train)
            model = search.best_estimator_
            print(f"   최적 파라미터: {search.best_params_}")
        else:
            model = GradientBoostingRegressor(
                n_estimators=300,
                learning_rate=0.1,
                max_depth=12,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
    elif model_type == 'xgboost' and XGBOOST_AVAILABLE:
        if tune_hyperparams:
            print("   하이퍼파라미터 튜닝 중...")
            param_grid = {
                'n_estimators': [200, 300, 400],
                'learning_rate': [0.05, 0.1, 0.15],
                'max_depth': [6, 8, 10],
                'min_child_weight': [1, 3, 5],
                'subsample': [0.8, 0.9, 1.0]
            }
            base_model = xgb.XGBRegressor(random_state=42, n_jobs=-1)
            search = RandomizedSearchCV(
                base_model, param_grid, n_iter=20, cv=3,
                scoring='r2', n_jobs=-1, random_state=42, verbose=1
            )
            search.fit(X_train, y_train)
            model = search.best_estimator_
            print(f"   최적 파라미터: {search.best_params_}")
        else:
            model = xgb.XGBRegressor(
                n_estimators=300,
                learning_rate=0.1,
                max_depth=8,
                min_child_weight=3,
                subsample=0.9,
                random_state=42,
                n_jobs=-1
            )
    elif model_type == 'lightgbm' and LIGHTGBM_AVAILABLE:
        if tune_hyperparams:
            print("   하이퍼파라미터 튜닝 중...")
            param_grid = {
                'n_estimators': [200, 300, 400],
                'learning_rate': [0.05, 0.1, 0.15],
                'max_depth': [6, 8, 10],
                'num_leaves': [31, 50, 70],
                'min_child_samples': [10, 20, 30]
            }
            base_model = lgb.LGBMRegressor(random_state=42, n_jobs=-1, verbose=-1)
            search = RandomizedSearchCV(
                base_model, param_grid, n_iter=20, cv=3,
                scoring='r2', n_jobs=-1, random_state=42, verbose=1
            )
            search.fit(X_train, y_train)
            model = search.best_estimator_
            print(f"   최적 파라미터: {search.best_params_}")
        else:
            model = lgb.LGBMRegressor(
                n_estimators=300,
                learning_rate=0.1,
                max_depth=8,
                num_leaves=50,
                min_child_samples=20,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )
    else:
        raise ValueError(f"Unknown model type: {model_type} or not available")
    
    # 학습
    model.fit(X_train, y_train)
    
    # 예측
    y_pred = model.predict(X_test)
    
    # 평가
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    print(f"✅ 학습 완료")
    print(f"   MAE: {mae:.2f}")
    print(f"   RMSE: {rmse:.2f}")
    print(f"   R²: {r2:.4f}")
    
    return model, {
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'y_pred': y_pred,
        'y_test': y_test
    }


def plot_feature_importance(model, features, model_type):
    """특성 중요도 시각화"""
    print(f"\n📊 특성 중요도 분석 중...")
    
    feature_importance = pd.DataFrame({
        'feature': features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n상위 10개 특성:")
    print(feature_importance.head(10).to_string(index=False))
    
    # 시각화
    plt.figure(figsize=(10, 8))
    plt.barh(feature_importance['feature'], feature_importance['importance'])
    plt.xlabel('Importance')
    plt.title(f'{model_type} - Feature Importance')
    plt.gca().invert_yaxis()
    plt.tight_layout()
    
    # 저장
    output_dir = 'ml_models'
    os.makedirs(output_dir, exist_ok=True)
    plt.savefig(f'{output_dir}/feature_importance_{model_type}.png', dpi=150)
    print(f"✅ 특성 중요도 그래프 저장: {output_dir}/feature_importance_{model_type}.png")
    plt.close()


def save_model(model, features, metrics, model_type, mode='pre'):
    """모델 저장"""
    output_dir = os.path.join('ml_models', mode)
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    prefix = f'{mode}_{model_type}_{timestamp}'
    
    # 모델 저장
    model_path = f'{output_dir}/iracing_rank_predictor_{prefix}.pkl'
    joblib.dump(model, model_path)
    print(f"✅ 모델 저장: {model_path}")
    
    # 특성 목록 저장
    features_path = f'{output_dir}/model_features_{prefix}.json'
    with open(features_path, 'w') as f:
        json.dump(features, f, indent=2)
    print(f"✅ 특성 목록 저장: {features_path}")
    
    # 메타데이터 저장
    metadata = {
        'model_type': model_type,
        'mode': mode,
        'timestamp': timestamp,
        'features': features,
        'metrics': {
            'mae': float(metrics['mae']),
            'rmse': float(metrics['rmse']),
            'r2': float(metrics['r2'])
        }
    }
    metadata_path = f'{output_dir}/model_metadata_{prefix}.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ 메타데이터 저장: {metadata_path}")
    
    return model_path, features_path, metadata_path


def train_specialized_models(df_clean, features, target='actual_finish_position'):
    """유저별, 트랙별, 차량별 특화 모델 학습"""
    print("\n" + "="*60)
    print("🎯 특화 모델 학습 시작\n")
    
    specialized_results = {}
    
    # 1. 유저별 특화 모델 (데이터가 많은 유저만)
    print("👤 유저별 특화 모델 학습 중...")
    user_counts = df_clean['cust_id'].value_counts()
    top_users = user_counts[user_counts >= 50].index  # 최소 50개 레코드 이상
    
    if len(top_users) > 0:
        print(f"   {len(top_users)}명의 유저에 대해 특화 모델 학습 (최소 50개 레코드)")
        user_models = {}
        for user_id in top_users[:10]:  # 상위 10명만 (시간 절약)
            user_data = df_clean[df_clean['cust_id'] == user_id]
            if len(user_data) < 30:  # 테스트 세트를 위해 최소 30개 필요
                continue
            
            X_user = user_data[features].values
            y_user = user_data[target].values
            
            if len(X_user) < 30:
                continue
            
            X_train, X_test, y_train, y_test = train_test_split(
                X_user, y_user, test_size=0.2, random_state=42
            )
            
            # 간단한 모델 학습 (데이터가 적으므로)
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            user_models[user_id] = {
                'model': model,
                'mae': mae,
                'r2': r2,
                'samples': len(user_data)
            }
            
            if len(user_models) % 5 == 0:
                print(f"   진행: {len(user_models)}/{min(10, len(top_users))}명 완료")
        
        if user_models:
            avg_r2 = np.mean([m['r2'] for m in user_models.values()])
            avg_mae = np.mean([m['mae'] for m in user_models.values()])
            print(f"   ✅ 유저별 모델: 평균 R²={avg_r2:.4f}, 평균 MAE={avg_mae:.2f} ({len(user_models)}개 모델)")
            specialized_results['user_models'] = user_models
    
    # 2. 트랙별 특화 모델
    print("\n🏁 트랙별 특화 모델 학습 중...")
    if 'track_id' in df_clean.columns:
        track_counts = df_clean['track_id'].value_counts()
        top_tracks = track_counts[track_counts >= 100].index  # 최소 100개 레코드 이상
        
        if len(top_tracks) > 0:
            print(f"   {len(top_tracks)}개 트랙에 대해 특화 모델 학습 (최소 100개 레코드)")
            track_models = {}
            for track_id in top_tracks[:10]:  # 상위 10개만
                track_data = df_clean[df_clean['track_id'] == track_id]
                if len(track_data) < 50:
                    continue
                
                X_track = track_data[features].values
                y_track = track_data[target].values
                
                X_train, X_test, y_train, y_test = train_test_split(
                    X_track, y_track, test_size=0.2, random_state=42
                )
                
                model = GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.1,
                    max_depth=8,
                    random_state=42
                )
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                track_models[track_id] = {
                    'model': model,
                    'mae': mae,
                    'r2': r2,
                    'samples': len(track_data)
                }
            
            if track_models:
                avg_r2 = np.mean([m['r2'] for m in track_models.values()])
                avg_mae = np.mean([m['mae'] for m in track_models.values()])
                print(f"   ✅ 트랙별 모델: 평균 R²={avg_r2:.4f}, 평균 MAE={avg_mae:.2f} ({len(track_models)}개 모델)")
                specialized_results['track_models'] = track_models
    
    # 3. 차량별 특화 모델
    print("\n🚗 차량별 특화 모델 학습 중...")
    if 'car_id' in df_clean.columns:
        car_counts = df_clean['car_id'].value_counts()
        top_cars = car_counts[car_counts >= 100].index  # 최소 100개 레코드 이상
        
        if len(top_cars) > 0:
            print(f"   {len(top_cars)}개 차량에 대해 특화 모델 학습 (최소 100개 레코드)")
            car_models = {}
            for car_id in top_cars[:10]:  # 상위 10개만
                car_data = df_clean[df_clean['car_id'] == car_id]
                if len(car_data) < 50:
                    continue
                
                X_car = car_data[features].values
                y_car = car_data[target].values
                
                X_train, X_test, y_train, y_test = train_test_split(
                    X_car, y_car, test_size=0.2, random_state=42
                )
                
                model = GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.1,
                    max_depth=8,
                    random_state=42
                )
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                car_models[car_id] = {
                    'model': model,
                    'mae': mae,
                    'r2': r2,
                    'samples': len(car_data)
                }
            
            if car_models:
                avg_r2 = np.mean([m['r2'] for m in car_models.values()])
                avg_mae = np.mean([m['mae'] for m in car_models.values()])
                print(f"   ✅ 차량별 모델: 평균 R²={avg_r2:.4f}, 평균 MAE={avg_mae:.2f} ({len(car_models)}개 모델)")
                specialized_results['car_models'] = car_models
    
    return specialized_results


def main(mode='pre', tune_hyperparams=False):
    """메인 함수
    
    Args:
        mode: 'pre' (레이스 전) 또는 'post' (그리드 반영)
        tune_hyperparams: 하이퍼파라미터 튜닝 여부 (기본값: False, 시간 소요)
    """
    print(f"🚀 iRacing 순위 예측 ML 모델 학습 시작 (mode={mode})\n")
    if tune_hyperparams:
        print("⚙️  하이퍼파라미터 튜닝 모드 활성화 (시간이 오래 걸릴 수 있습니다)\n")
    
    # 1. 데이터 로드
    df = load_data()
    
    # 2. 데이터 전처리
    df_clean = preprocess_data(df)
    
    # 3. 카테고리 변수 인코딩
    categorical_cols = ['series_id', 'track_id', 'car_id']
    df_encoded, encoder, encoded_feature_names = encode_categorical_features(
        df_clean, categorical_cols, use_onehot=True
    )
    
    # 4. 특성 선택 (레이스 시작 전에 알 수 있는 필드만!)
    # ⚠️ 주의: starting_position, laps_complete는 레이스 종료 후 정보이므로 제외
    base_features = [
        # 핵심 특성 (레이스 시작 전 알 수 있음)
        'i_rating',
        'safety_rating',
        
        # 상대 전력 통계 (핵심!) - 레이스 시작 전 알 수 있음
        'avg_opponent_ir',
        'max_opponent_ir',
        'min_opponent_ir',
        'ir_diff_from_avg',
        'sof',
        
        # 파생 변수 (상대 전력 기반)
        'ir_advantage',
        'ir_range',
        'ir_rank_pct',
        'ir_vs_max',
        'ir_vs_min',
        'ir_std_estimate',
        'ir_relative_to_sof',
        
        # 주행 특성 (과거 데이터, 레이스 시작 전 알 수 있음)
        'best_lap_time',
        'average_lap_time',
        'lap_time_diff',
        'lap_time_consistency',
        
        # 세션 컨텍스트 (레이스 시작 전 알 수 있음)
        'total_participants',
        
        # 유저별 상대 전력(ir_diff_from_avg) 구간별 성능 특성 (핵심!)
        # 내 iRating vs 상대 평균 iRating 차이에 따른 성능 패턴
        'user_avg_finish_pct_much_lower',  # 내가 상대보다 200+ 낮을 때 → 강한 상대
        'user_avg_finish_pct_lower',       # 내가 상대보다 50-200 낮을 때 → 약간 강한 상대
        'user_avg_finish_pct_similar',    # 비슷할 때
        'user_avg_finish_pct_higher',     # 내가 상대보다 50-200 높을 때 → 약간 약한 상대
        'user_avg_finish_pct_much_higher', # 내가 상대보다 200+ 높을 때 → 약한 상대
        'user_ir_diff_performance_diff',   # 강한 상대에서의 성능 - 약한 상대에서의 성능
        'user_expected_finish_pct_by_ir_diff',  # 현재 상대 전력 구간에서의 예상 성능
        
        # 사고 영향도 특성 (사고 발생 시 순위 변동 반영)
        'incident_impact_on_position',      # 사고 발생 시 평균 순위 하락 (완주율 단위)
        'incident_impact_rank_drop',        # 사고 발생 시 평균 순위 하락 (순위 단위)
        'high_incident_risk',              # 사고 발생 확률이 높은지 여부 (0/1)
    ]
    
    if mode == 'post':
        base_features += POST_ONLY_FEATURES
    
    # 인코딩된 카테고리 특성 추가
    if encoded_feature_names:
        features = base_features + encoded_feature_names
        print(f"\n📊 총 특성 수: {len(base_features)} (기본) + {len(encoded_feature_names)} (인코딩) = {len(features)}개")
    else:
        features = base_features
        print(f"\n📊 총 특성 수: {len(features)}개")
    
    # 제외된 필드 (레이스 시작 전에 알 수 없음):
    # - starting_position: 레이스 시작 전에는 알 수 없음 (퀄리파잉 결과 필요)
    # - laps_complete: 레이스 종료 후에만 알 수 있음
    
    # 특성이 모두 있는지 확인
    missing_features = [f for f in features if f not in df_encoded.columns]
    if missing_features:
        print(f"⚠️  누락된 특성: {missing_features}")
        features = [f for f in features if f in df_encoded.columns]
    
    # 5. 데이터 준비
    X = df_encoded[features].values
    y = df_encoded['actual_finish_position'].values
    
    print(f"\n📊 데이터 준비 완료:")
    print(f"   특성 수: {len(features)}")
    print(f"   샘플 수: {len(X)}")
    
    # 5. 학습/테스트 분할
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print(f"   학습 세트: {len(X_train)}개")
    print(f"   테스트 세트: {len(X_test)}개")
    
    # 6. 특화 모델 학습 (유저별, 트랙별, 차량별)
    specialized_results = train_specialized_models(df_encoded, features)
    
    # 7. 모델 학습 (여러 모델 시도)
    all_models = {}
    all_metrics = {}
    all_model_paths = {}  # 모델 파일 경로 저장
    
    # Random Forest
    print("\n" + "="*60)
    model_rf, metrics_rf = train_model(X_train, y_train, X_test, y_test, 'random_forest', tune_hyperparams=tune_hyperparams)
    plot_feature_importance(model_rf, features, 'random_forest')
    model_path_rf, _, _ = save_model(model_rf, features, metrics_rf, 'random_forest', mode=mode)
    all_models['random_forest'] = model_rf
    all_metrics['random_forest'] = metrics_rf
    all_model_paths['random_forest'] = model_path_rf
    
    # Gradient Boosting
    print("\n" + "="*60)
    model_gb, metrics_gb = train_model(X_train, y_train, X_test, y_test, 'gradient_boosting', tune_hyperparams=tune_hyperparams)
    plot_feature_importance(model_gb, features, 'gradient_boosting')
    model_path_gb, _, _ = save_model(model_gb, features, metrics_gb, 'gradient_boosting', mode=mode)
    all_models['gradient_boosting'] = model_gb
    all_metrics['gradient_boosting'] = metrics_gb
    all_model_paths['gradient_boosting'] = model_path_gb
    
    # XGBoost (사용 가능한 경우)
    if XGBOOST_AVAILABLE:
        print("\n" + "="*60)
        model_xgb, metrics_xgb = train_model(X_train, y_train, X_test, y_test, 'xgboost', tune_hyperparams=tune_hyperparams)
        plot_feature_importance(model_xgb, features, 'xgboost')
        model_path_xgb, _, _ = save_model(model_xgb, features, metrics_xgb, 'xgboost', mode=mode)
        all_models['xgboost'] = model_xgb
        all_metrics['xgboost'] = metrics_xgb
        all_model_paths['xgboost'] = model_path_xgb
    
    # LightGBM (사용 가능한 경우)
    if LIGHTGBM_AVAILABLE:
        print("\n" + "="*60)
        model_lgb, metrics_lgb = train_model(X_train, y_train, X_test, y_test, 'lightgbm', tune_hyperparams=tune_hyperparams)
        plot_feature_importance(model_lgb, features, 'lightgbm')
        model_path_lgb, _, _ = save_model(model_lgb, features, metrics_lgb, 'lightgbm', mode=mode)
        all_models['lightgbm'] = model_lgb
        all_metrics['lightgbm'] = metrics_lgb
        all_model_paths['lightgbm'] = model_path_lgb
    
    # 8. 앙상블 모델 (최고 성능 모델들 조합)
    print("\n" + "="*60)
    print("🎯 앙상블 모델 생성 중...")
    
    # R² 점수로 정렬하여 상위 모델 선택
    sorted_models = sorted(all_metrics.items(), key=lambda x: x[1]['r2'], reverse=True)
    top_models = sorted_models[:min(3, len(sorted_models))]  # 상위 3개 모델
    
    if len(top_models) >= 2:
        # 가중 평균 앙상블 (R² 점수 기반 가중치)
        total_r2 = sum(m[1]['r2'] for m in top_models)
        weights = [m[1]['r2'] / total_r2 for m in top_models]
        
        ensemble_pred = np.zeros(len(y_test))
        for i, (name, metrics) in enumerate(top_models):
            weight = weights[i]
            pred = all_models[name].predict(X_test)
            ensemble_pred += weight * pred
            print(f"   {name}: 가중치 {weight:.3f} (R²={metrics['r2']:.4f})")
        
        # 앙상블 평가
        ensemble_mae = mean_absolute_error(y_test, ensemble_pred)
        ensemble_rmse = np.sqrt(mean_squared_error(y_test, ensemble_pred))
        ensemble_r2 = r2_score(y_test, ensemble_pred)
        
        print(f"✅ 앙상블 모델 성능:")
        print(f"   MAE: {ensemble_mae:.2f}")
        print(f"   RMSE: {ensemble_rmse:.2f}")
        print(f"   R²: {ensemble_r2:.4f}")
        
        # 앙상블 모델 저장
        ensemble_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        ensemble_config = {
            'model_type': 'ensemble',
            'timestamp': ensemble_timestamp,
            'mode': mode,
            'features': features,
            'models': [
                {
                    'name': name,
                    'weight': float(weight),
                    'r2': float(metrics['r2']),
                    'model_path': os.path.relpath(all_model_paths.get(name), os.path.join('ml_models', mode)) if all_model_paths.get(name) else f'iracing_rank_predictor_{mode}_{name}_{ensemble_timestamp}.pkl'
                }
                for (name, metrics), weight in zip(top_models, weights)
            ],
            'metrics': {
                'mae': float(ensemble_mae),
                'rmse': float(ensemble_rmse),
                'r2': float(ensemble_r2)
            }
        }
        
        output_dir = os.path.join('ml_models', mode)
        os.makedirs(output_dir, exist_ok=True)
        ensemble_config_path = f'{output_dir}/ensemble_config_{mode}_{ensemble_timestamp}.json'
        with open(ensemble_config_path, 'w') as f:
            json.dump(ensemble_config, f, indent=2)
        print(f"✅ 앙상블 설정 저장: {ensemble_config_path}")
        print(f"   사용 모델: {', '.join([m['name'] for m in ensemble_config['models']])}")
    
    # 9. 특화 모델 결과 요약
    if specialized_results:
        print("\n" + "="*60)
        print("📊 특화 모델 성능 요약:")
        if 'user_models' in specialized_results:
            user_r2s = [m['r2'] for m in specialized_results['user_models'].values()]
            print(f"   유저별 모델: 평균 R²={np.mean(user_r2s):.4f} (최고: {max(user_r2s):.4f}, 최저: {min(user_r2s):.4f})")
        if 'track_models' in specialized_results:
            track_r2s = [m['r2'] for m in specialized_results['track_models'].values()]
            print(f"   트랙별 모델: 평균 R²={np.mean(track_r2s):.4f} (최고: {max(track_r2s):.4f}, 최저: {min(track_r2s):.4f})")
        if 'car_models' in specialized_results:
            car_r2s = [m['r2'] for m in specialized_results['car_models'].values()]
            print(f"   차량별 모델: 평균 R²={np.mean(car_r2s):.4f} (최고: {max(car_r2s):.4f}, 최저: {min(car_r2s):.4f})")
    
    # 10. 결과 비교
    print("\n" + "="*60)
    print("📈 모델 성능 비교:")
    for name, metrics in sorted(all_metrics.items(), key=lambda x: x[1]['r2'], reverse=True):
        print(f"   {name:20s}: MAE={metrics['mae']:.2f}, RMSE={metrics['rmse']:.2f}, R²={metrics['r2']:.4f}")
    
    if len(top_models) >= 2:
        print(f"   {'Ensemble':20s}: MAE={ensemble_mae:.2f}, RMSE={ensemble_rmse:.2f}, R²={ensemble_r2:.4f}")
    
    print("\n✅ 학습 완료!")
    print("\n💡 성능 개선 팁:")
    print("   1. 하이퍼파라미터 튜닝: tune_hyperparams=True로 설정 (시간 소요)")
    print("   2. 더 많은 데이터 수집: 현재 31,025개 → 목표 50,000개 이상")
    print("   3. ✅ 카테고리 변수 인코딩: 완료 (series_id, track_id, car_id)")
    print("   4. ✅ 특화 모델: 완료 (유저별, 트랙별, 차량별)")
    print("   5. 트랙/차량 조합별 모델: 특정 트랙+차량 조합에 대한 모델 학습")
    print("   6. 시간대별 모델: 시즌, 패치별로 모델 분리")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='iRacing 순위 예측 모델 학습')
    parser.add_argument('--mode', choices=['pre', 'post'], default='pre', help='모델 모드 선택 (pre: 레이스 전, post: 그리드 반영)')
    parser.add_argument('--tune', '-t', action='store_true', help='하이퍼파라미터 튜닝 활성화')
    args = parser.parse_args()
    main(mode=args.mode, tune_hyperparams=args.tune)

