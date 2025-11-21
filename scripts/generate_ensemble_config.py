import argparse
import datetime
import glob
import json
import os
from collections import defaultdict

# 학습 스크립트가 프로젝트 루트의 ml_models에 저장하므로 경로 계산
# 스크립트 위치: ghostx_front/scripts/generate_ensemble_config.py
# 모델 위치: 프로젝트 루트/ml_models/
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))  # ghostx_front/scripts -> ghostx_front -> 프로젝트 루트
BASE = os.path.join(project_root, 'ml_models')
if not os.path.exists(BASE):
    # 대안: ghostx_front/ml_models
    BASE = os.path.join(project_root, 'ghostx_front', 'ml_models')

parser = argparse.ArgumentParser(description='Generate ensemble config for iRacing ML models')
parser.add_argument('--mode', choices=['pre', 'post'], default='pre', help='Target model mode directory')
args = parser.parse_args()

mode_dir = os.path.join(BASE, args.mode)
# save_model 함수가 저장하는 형식: model_metadata_{mode}_{model_type}_{timestamp}.json
metadata_paths = glob.glob(os.path.join(mode_dir, f'model_metadata_{args.mode}_*.json'))
records = []

for path in metadata_paths:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    r2 = data.get('metrics', {}).get('r2')
    if r2 is None:
        continue
    model_type = data.get('model_type')
    timestamp = data.get('timestamp')
    # save_model 함수가 저장하는 형식: iracing_rank_predictor_{mode}_{model_type}_{timestamp}.pkl
    model_path = os.path.join(mode_dir, f'iracing_rank_predictor_{args.mode}_{model_type}_{timestamp}.pkl')
    features_path = os.path.join(mode_dir, f'model_features_{args.mode}_{model_type}_{timestamp}.json')
    if not os.path.exists(model_path) or not os.path.exists(features_path):
        continue
    with open(features_path, 'r', encoding='utf-8') as f:
        features = json.load(f)
    records.append({
        'model_type': model_type,
        'timestamp': timestamp,
        'r2': float(r2),
        'model_path': model_path,
        'features': features,
        'feature_key': tuple(features),
    })

if len(records) < 2:
    raise SystemExit(f'Need at least two models for mode "{args.mode}" with metadata and feature lists.')

groups = defaultdict(list)
for rec in records:
    groups[rec['feature_key']].append(rec)

best_group = None
best_score = -1.0
for feature_key, group in groups.items():
    if len(group) < 2:
        continue
    avg_score = sum(rec['r2'] for rec in group) / len(group)
    if avg_score > best_score:
        best_score = avg_score
        best_group = group

if not best_group:
    raise SystemExit(f'No compatible feature group with at least two models found for mode "{args.mode}".')

best_group.sort(key=lambda r: r['r2'], reverse=True)
top = best_group[:3]
total_r2 = sum(r['r2'] for r in top)
weights = [r['r2'] / total_r2 for r in top]
features = list(top[0]['feature_key'])

timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
config = {
    'model_type': 'ensemble',
    'timestamp': timestamp,
    'mode': args.mode,
    'features': features,
    'models': [
        {
            'name': rec['model_type'],
            'weight': float(weights[i]),
            'r2': rec['r2'],
            'model_path': os.path.relpath(rec['model_path'], mode_dir),
        }
        for i, rec in enumerate(top)
    ],
    'metrics': {
        'mae': None,
        'rmse': None,
        'r2': sum(rec['r2'] for rec in top) / len(top),
    },
}

output_path = os.path.join(mode_dir, f'ensemble_config_{args.mode}_{timestamp}.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2)
print(f'✅ Ensemble config generated for mode {args.mode}:', output_path)

