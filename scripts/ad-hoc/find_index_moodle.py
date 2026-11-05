import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for i, line in enumerate(lines):
    if 'moodle' in line.lower() or 'הגשה' in line:
        print(f"L{i+1}: {line.strip()[:140]}")
