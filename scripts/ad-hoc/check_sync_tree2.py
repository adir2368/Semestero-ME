with open('planner_module.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(974, min(len(lines), 1030)):
    safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in lines[i])
    print(f"{i+1}: {safe}", end='')
