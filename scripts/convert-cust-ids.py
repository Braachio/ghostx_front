"""
cust_id 텍스트 파일을 JavaScript 배열로 변환하는 Python 스크립트

사용법:
    python scripts/convert-cust-ids.py input.txt output.js

또는:
    python scripts/convert-cust-ids.py
    (입력 파일 경로를 프롬프트에서 입력)
"""

import sys
import os

def convert_to_js_array(input_file, output_file=None):
    """텍스트 파일의 cust_id를 JavaScript 배열로 변환"""
    
    # 입력 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # cust_id 추출 (숫자만)
    cust_ids = []
    for line in lines:
        line = line.strip()
        if line and line.isdigit():
            cust_ids.append(line)
    
    print(f"✅ 총 {len(cust_ids)}개 cust_id 추출됨")
    
    # JavaScript 배열 생성
    # 한 줄에 10개씩 포맷팅
    js_lines = ['const US_CUST_IDS = [']
    
    for i in range(0, len(cust_ids), 10):
        batch = cust_ids[i:i+10]
        js_line = "  '" + "', '".join(batch) + "',"
        js_lines.append(js_line)
    
    # 마지막 쉼표 제거
    if js_lines[-1].endswith(','):
        js_lines[-1] = js_lines[-1][:-1]
    
    js_lines.append(']')
    js_lines.append('')
    js_lines.append('// 사용법:')
    js_lines.append('// collectAllTrainingData(US_CUST_IDS, 5, 50, false, \'us_collect_progress\')')
    
    js_content = '\n'.join(js_lines)
    
    # 출력 파일에 저장
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ JavaScript 파일 생성 완료: {output_file}")
    else:
        # 콘솔에 출력
        print("\n" + "="*80)
        print("생성된 JavaScript 코드:")
        print("="*80)
        print(js_content)
        print("="*80)
    
    return js_content

if __name__ == '__main__':
    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) >= 3 else None
    else:
        input_file = input("입력 파일 경로: ").strip()
        output_file = input("출력 파일 경로 (엔터 시 콘솔 출력): ").strip() or None
    
    if not os.path.exists(input_file):
        print(f"❌ 파일을 찾을 수 없습니다: {input_file}")
        sys.exit(1)
    
    convert_to_js_array(input_file, output_file)


