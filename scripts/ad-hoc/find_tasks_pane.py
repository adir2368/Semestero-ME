import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'tasks' in line.lower() and ('view' in line.lower() or 'panel' in line.lower() or 'tab-pane' in line.lower() or 'section' in line.lower()):
        print(f"L{i+1}: {line.strip()[:140]}")
