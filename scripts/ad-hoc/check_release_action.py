with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(24428, min(len(lines), 24530)):
    print(f"{i+1}: {lines[i]}", end='')
