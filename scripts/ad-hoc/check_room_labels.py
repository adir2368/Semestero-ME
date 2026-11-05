import sys, re
sys.stdout.reconfigure(encoding='utf-8')

for fname in ['app.js', 'index.html', 'timetable_generator.js']:
    with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/' + fname, 'r', encoding='utf-8') as f:
        text = f.read()
    print(f'=== {fname} ===')
    for i, line in enumerate(text.splitlines()):
        if 'חדר ' in line:
            print(f'{i+1}: {line.strip()[:100]}')
