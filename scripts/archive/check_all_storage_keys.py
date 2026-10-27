import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

keys = set(re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', text))
print("LocalStorage keys in app.js:")
for k in sorted(keys):
    print(" ", k)
