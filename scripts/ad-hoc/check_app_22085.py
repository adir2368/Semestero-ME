with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(22080, 22092):
    print(f"{i+1}: {lines[i]}", end='')
