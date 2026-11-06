import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="tab-tasks"' in line:
        for j in range(i, min(len(lines), i+35)):
            print(f"L{j+1}: {lines[j]}", end='')
        break
