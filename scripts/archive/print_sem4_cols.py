import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('// Semester 6 (3 courses)')
print(text[idx-500:idx+200])
