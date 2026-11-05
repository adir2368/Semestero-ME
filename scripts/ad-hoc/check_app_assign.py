with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(7150, 6000, -1):
    line = lines[i].strip()
    if '=' in line and ('{' in line or '[' in line):
        print(f"{i+1}: {line[:80]}")
        break
