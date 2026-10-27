import re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

print("--- Searching guest in app.js ---")
for m in re.finditer(r'guest', text, re.IGNORECASE):
    idx = m.start()
    snippet = text[max(0, idx-60):min(len(text), idx+100)].replace('\n', ' ')
    if any(k in snippet for k in ['courses', 'default', 'state', 'login', 'user', 'init']):
        print(f"[{idx}] {snippet}")
