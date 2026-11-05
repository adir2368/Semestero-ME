import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'href=[\'"][^\'"]*moodle[^\'"]*[\'"]', text, re.IGNORECASE)]
print(f"Found {len(matches)} moodle href matches in app.js:")
lines = text.splitlines()
for m in matches:
    # find line number
    lno = text[:m].count('\n') + 1
    print(f"L{lno}: {lines[lno-1].strip()[:140]}")
