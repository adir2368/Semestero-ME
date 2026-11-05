with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'releases/latest' in line:
        for j in range(max(0, i-20), min(len(lines), i+80)):
            print(f"{j+1}: {lines[j]}", end='')
        break
