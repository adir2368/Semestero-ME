with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(6920, 7050):
    if '"semester": 2' in lines[i]:
        for j in range(max(0, i-25), min(len(lines), i+10)):
            print(f"{j+1}: {lines[j].strip()}")
        break
