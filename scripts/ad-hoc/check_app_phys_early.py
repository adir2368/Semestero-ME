with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '01140071' in line or '114071' in line or '01140075' in line or '114075' in line:
        if i < 9000: # before the logic
            print(f"Line {i+1}: {line.strip()[:100]}")
