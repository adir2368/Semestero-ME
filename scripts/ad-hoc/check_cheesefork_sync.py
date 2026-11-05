with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'syncLiveCheeseForkData' in line:
        for j in range(i, min(len(lines), i + 120)):
            print(f"{j+1}: {lines[j]}", end='')
        break
