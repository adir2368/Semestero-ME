import re

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

scripts = re.findall(r'<script[^>]+src=[\'"]([^\'"]+)[\'"]', text)
print('Scripts in index.html:')
for s in scripts:
    if any(k in s for k in ['app', 'planner', 'state', 'catalog']):
        print(' ', s)
