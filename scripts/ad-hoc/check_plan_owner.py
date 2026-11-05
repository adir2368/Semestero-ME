with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(6923, 0, -1):
    line = lines[i]
    if 'AUTHENTIC' in line or 'userState' in line or 'PRELOADED' in line or 'adir' in line or 'var ' in line or 'const ' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
        break
