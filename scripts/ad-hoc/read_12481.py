import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(12465, 12500):
    if i < len(lines):
        print(f"L{i+1}: {lines[i]}", end='')
