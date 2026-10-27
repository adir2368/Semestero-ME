import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'<script[^>]+src=[\'"]([^\'"]+)[\'"]', text)
for m in matches:
    if 'app.js' in m or 'planner' in m:
        print(m)
