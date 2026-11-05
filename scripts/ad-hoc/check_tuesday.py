with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(8695, 8740):
    safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in lines[i])
    print(f"{i+1}: {safe}", end='')
