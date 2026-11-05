with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(19890, min(len(lines), 19950)):
    print(f"{i+1}: {lines[i]}", end='')
