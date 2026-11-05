with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '2026-11-12' in line:
        for j in range(max(0, i-5), min(len(lines), i+10)):
            print(f"{j+1}: {lines[j].strip()}")
