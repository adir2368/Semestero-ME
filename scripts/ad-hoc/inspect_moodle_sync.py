import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\moodle_sync.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
for i, line in enumerate(lines):
    if 'moodleurl' in line.lower() or 'url' in line.lower() and ('moodle' in line.lower() or 'calendar' in line.lower() or 'event' in line.lower()):
        print(f"L{i+1}: {line.strip()[:140]}")
