"""
앙상블 모델 로드 및 예측 유틸리티

사용법:
    from scripts.load_ensemble_model import load_ensemble_model, predict_rank
    
    # 앙상블 모델 로드
    ensemble = load_ensemble_model('ml_models/ensemble_config_20251119_160720.json')
    
    # 예측
    features = [...]  # 특성 벡터
    predicted_rank = predict_rank(ensemble, features)
"""

import json
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, List, Any, Optional


def load_ensemble_model(config_path: str) -> Dict[str, Any]:
    """
    앙상블 모델 설정 파일 로드
    
    Args:
        config_path: 앙상블 설정 JSON 파일 경로
        
    Returns:
        앙상블 설정 딕셔너리 (모델 객체 포함)
    """
    config_path = Path(config_path)
    if not config_path.exists():
        raise FileNotFoundError(f"앙상블 설정 파일을 찾을 수 없습니다: {config_path}")
    
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    # 각 모델 로드
    config_dir = config_path.parent
    loaded_models = []
    
    for model_info in config['models']:
        model_file = config_dir / model_info['model_path']
        if not model_file.exists():
            # 파일명만 있는 경우 파일명으로 검색
            model_file = list(config_dir.glob(f"*{model_info['name']}*.pkl"))
            if model_file:
                model_file = model_file[0]
            else:
                raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {model_info['model_path']}")
        
        model = joblib.load(model_file)
        loaded_models.append({
            'name': model_info['name'],
            'model': model,
            'weight': model_info['weight'],
            'r2': model_info['r2']
        })
        print(f"✅ {model_info['name']} 모델 로드 완료 (가중치: {model_info['weight']:.3f})")
    
    config['loaded_models'] = loaded_models
    print(f"\n✅ 앙상블 모델 로드 완료: {len(loaded_models)}개 모델")
    print(f"   예상 성능: R²={config['metrics']['r2']:.4f}, MAE={config['metrics']['mae']:.2f}")
    
    return config


def predict_rank(ensemble: Dict[str, Any], features: np.ndarray) -> float:
    """
    앙상블 모델로 순위 예측
    
    Args:
        ensemble: load_ensemble_model()로 로드한 앙상블 설정
        features: 특성 벡터 (1D 배열 또는 2D 배열)
        
    Returns:
        예측된 순위 (float)
    """
    if 'loaded_models' not in ensemble:
        raise ValueError("앙상블 모델이 로드되지 않았습니다. load_ensemble_model()을 먼저 호출하세요.")
    
    # features를 2D 배열로 변환
    if features.ndim == 1:
        features = features.reshape(1, -1)
    
    # 각 모델의 예측을 가중 평균
    ensemble_pred = 0.0
    
    for model_info in ensemble['loaded_models']:
        model = model_info['model']
        weight = model_info['weight']
        pred = model.predict(features)[0]  # 첫 번째 샘플의 예측
        ensemble_pred += weight * pred
    
    return float(ensemble_pred)


def predict_ranks_batch(ensemble: Dict[str, Any], features_array: np.ndarray) -> np.ndarray:
    """
    앙상블 모델로 여러 샘플의 순위 예측 (배치)
    
    Args:
        ensemble: load_ensemble_model()로 로드한 앙상블 설정
        features_array: 특성 배열 (2D: [n_samples, n_features])
        
    Returns:
        예측된 순위 배열 (1D: [n_samples])
    """
    if 'loaded_models' not in ensemble:
        raise ValueError("앙상블 모델이 로드되지 않았습니다. load_ensemble_model()을 먼저 호출하세요.")
    
    if features_array.ndim != 2:
        raise ValueError("features_array는 2D 배열이어야 합니다: [n_samples, n_features]")
    
    # 각 모델의 예측을 가중 평균
    ensemble_pred = np.zeros(features_array.shape[0])
    
    for model_info in ensemble['loaded_models']:
        model = model_info['model']
        weight = model_info['weight']
        pred = model.predict(features_array)
        ensemble_pred += weight * pred
    
    return ensemble_pred


def find_latest_ensemble_config(models_dir: str = 'ml_models') -> Optional[str]:
    """
    가장 최근 앙상블 설정 파일 찾기
    
    Args:
        models_dir: 모델 디렉토리 경로
        
    Returns:
        가장 최근 앙상블 설정 파일 경로 (없으면 None)
    """
    models_path = Path(models_dir)
    if not models_path.exists():
        return None
    
    ensemble_configs = list(models_path.glob('ensemble_config_*.json'))
    if not ensemble_configs:
        return None
    
    # 타임스탬프로 정렬 (파일명에 포함됨)
    latest = sorted(ensemble_configs, key=lambda p: p.stat().st_mtime, reverse=True)[0]
    return str(latest)


if __name__ == '__main__':
    # 테스트
    print("🔍 최신 앙상블 모델 찾기...")
    latest_config = find_latest_ensemble_config()
    
    if latest_config:
        print(f"✅ 최신 앙상블 설정: {latest_config}")
        ensemble = load_ensemble_model(latest_config)
        print(f"\n📊 앙상블 정보:")
        print(f"   특성 수: {len(ensemble['features'])}")
        print(f"   모델 수: {len(ensemble['loaded_models'])}")
        print(f"   성능: R²={ensemble['metrics']['r2']:.4f}, MAE={ensemble['metrics']['mae']:.2f}")
    else:
        print("❌ 앙상블 설정 파일을 찾을 수 없습니다.")


