with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(4765, 4785):
    print(f"{i+1}: {lines[i]}", end='')
