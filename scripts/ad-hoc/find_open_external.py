with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'openExternal', text, re.IGNORECASE)]
print(f"Found {len(matches)} openExternal matches in app.js:")
lines = text.splitlines()
for m in matches:
    lno = text[:m].count('\n') + 1
    print(f"L{lno}: {lines[lno-1].strip()[:140]}")
