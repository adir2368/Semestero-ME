import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'course' in line.lower() and 'modal' in line.lower() and '<div' in line:
        print(f"L{i+1}: {line.strip()[:140]}")
