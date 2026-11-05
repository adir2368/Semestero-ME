with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(3315, 3335):
    print(f"{i+1}: {lines[i]}", end='')
