import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'nodesGroup', text):
    pos = m.start()
    print(text[max(0, pos-40):min(len(text), pos+150)].replace('\n', ' '))
