import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'resolveDirectMoodleTaskUrl' in line or 'moodle' in line.lower() and ('calendar' in line.lower() or 'submission' in line.lower() or 'הגשה' in line or 'view.php' in line):
        print(f"L{i+1}: {line.strip()[:140]}")
