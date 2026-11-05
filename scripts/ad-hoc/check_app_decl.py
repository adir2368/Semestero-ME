with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(7150, 6000, -1):
    if 'const ' in lines[i] or 'let ' in lines[i] or 'var ' in lines[i]:
        print(f"{i+1}: {lines[i]}")
        break
