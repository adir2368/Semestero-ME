import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\moodle_sync.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1154, 1178):
    print(f"L{i+1}: {lines[i]}", end='')
