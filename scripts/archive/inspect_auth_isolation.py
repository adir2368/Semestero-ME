import re

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\auth_sync.js', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'(?:isolation|guest|test)', text, re.IGNORECASE):
    idx = m.start()
    snippet = text[max(0, idx-40):min(len(text), idx+100)].replace('\n', ' ')
    print(f"[{idx}] {snippet}")
