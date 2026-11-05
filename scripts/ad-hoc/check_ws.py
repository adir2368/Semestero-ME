with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(22083, 22088):
    print(repr(lines[i]))
