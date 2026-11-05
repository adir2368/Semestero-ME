with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '01250013' in line or '125013' in line:
        for j in range(max(0, i-15), min(len(lines), i+15)):
            if 'semester' in lines[j] or 'sem' in lines[j] or 'id' in lines[j]:
                print(f"Line {j+1}: {lines[j].strip()}")
        print('---')
