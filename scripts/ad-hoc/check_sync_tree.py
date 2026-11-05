with open('planner_module.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'syncPlannerToTree' in line:
        for j in range(i, min(len(lines), i + 50)):
            safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in lines[j])
            print(f"{j+1}: {safe}", end='')
        break
